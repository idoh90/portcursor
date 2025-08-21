import { differenceInSeconds } from 'date-fns'
import { db } from '../db'
import { flag } from '../flags'
import { trackMetric, trackError } from '../telemetry'
import type { PriceQuote } from '../../models/types'
import { priceQuoteSchema, tickerSchema } from '../../models/schemas'

type QuoteProvider = (symbol: string) => Promise<PriceQuote>

const cache = new Map<string, PriceQuote>()
const cacheTtlSecondsDefault = 30

let provider: QuoteProvider | undefined
let failureCount = 0
let circuitOpenUntil: number | null = null
const circuitThreshold = 3
const circuitOpenMs = 60_000
let lastCallAt = 0
const minIntervalMs = 500

export function setQuoteProvider(p: QuoteProvider) {
	provider = p
}

export async function getQuote(symbol: string, cacheTtlSeconds = cacheTtlSecondsDefault): Promise<PriceQuote> {
	const s = tickerSchema.parse(symbol)
	const cached = cache.get(s)
	if (cached && differenceInSeconds(new Date(), new Date(cached.asOf)) <= cacheTtlSeconds) {
		return cached
	}
	// Try persistent cache first (feature-flagged)
	if (flag('pricingDbCache')) {
		try {
			const dbCached = await (db as any).quotes?.get(s)
			if (dbCached && differenceInSeconds(new Date(), new Date(dbCached.asOf)) <= cacheTtlSeconds) {
				cache.set(s, dbCached)
				trackMetric({ name: 'quote.cache.db.hit', value: 1, tags: { symbol: s } })
				return dbCached
			}
			trackMetric({ name: 'quote.cache.db.miss', value: 1, tags: { symbol: s } })
		} catch {}
	}
	if (!provider) throw new Error('Quote provider not configured')
	if (circuitOpenUntil && Date.now() < circuitOpenUntil) {
		if (cached) return cached
		throw new Error('Price service temporarily unavailable')
	}
	try {
        const now = Date.now()
        const delta = now - lastCallAt
        if (delta < minIntervalMs) {
            await new Promise((r) => setTimeout(r, minIntervalMs - delta))
        }
		const raw = await provider(s)
		const q = priceQuoteSchema.parse(raw)
		failureCount = 0
		lastCallAt = Date.now()
		cache.set(s, q)
		if (flag('pricingDbCache')) {
			try { await (db as any).quotes?.put(q) } catch {}
		}
		return q
	} catch (e) {
		failureCount += 1
		if (failureCount >= circuitThreshold) {
			circuitOpenUntil = Date.now() + circuitOpenMs
		}
		if (cached) return cached
		// Last resort: serve potentially stale DB cache
		if (flag('pricingDbCache')) {
			try {
				const stale = await (db as any).quotes?.get(s)
				if (stale) return stale
			} catch {}
		}
		trackError('quote.fetch.error', e, { symbol: s })
		throw e instanceof Error ? e : new Error('Failed to fetch quote')
	}
}

export function getCachedQuote(symbol: string): PriceQuote | undefined {
	return cache.get(symbol)
}

export function getEffectivePrice(quote: PriceQuote): number {
	// Fallback to prevClose when market closed or last unavailable
	if (quote.last != null) return quote.last
	if (quote.prevClose != null) return quote.prevClose
	return 0
}

export async function getQuotesBatched(symbols: string[], cacheTtlSeconds = cacheTtlSecondsDefault): Promise<Map<string, PriceQuote>> {
	const unique = Array.from(new Set(symbols.map((s) => tickerSchema.parse(s))))
	const result = new Map<string, PriceQuote>()
	// Try cache first
	const toFetch: string[] = []
	for (const s of unique) {
		const cached = cache.get(s)
		if (cached && differenceInSeconds(new Date(), new Date(cached.asOf)) <= cacheTtlSeconds) {
			result.set(s, cached)
		} else {
			toFetch.push(s)
		}
	}
	// Fallback to sequential fetch with built-in rate limiting; can be improved to real batch provider
	for (const s of toFetch) {
		try {
			const q = await getQuote(s, cacheTtlSeconds)
			result.set(s, q)
		} catch (e) {
			// Skip symbol on failure; caller can handle missing entries
		}
	}
	return result
}


