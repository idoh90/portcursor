import { differenceInSeconds } from 'date-fns'
import { db } from '../db'
import { flag } from '../flags'
import { trackMetric, trackError } from '../telemetry'
import type { PriceQuote } from '../../models/types'
import { priceQuoteSchema, tickerSchema } from '../../models/schemas'
import { getCachedQuote, setCachedQuote, getCachedQuotes, setCachedQuotes } from './cacheManager'
import { unifiedQuote, unifiedQuoteBatch } from './providers/unifiedProvider'

type QuoteProvider = (symbol: string) => Promise<PriceQuote>

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
	// Check memory cache first (from cacheManager)
	const cached = getCachedQuote(s)
	if (cached && differenceInSeconds(new Date(), new Date(cached.asOf)) <= cacheTtlSeconds) {
		trackMetric({ name: 'quote.cache.memory.hit', value: 1, tags: { symbol: s } })
		return cached
	}
	// Try persistent cache first (feature-flagged)
	if (flag('pricingDbCache')) {
		try {
			const dbCached = await (db as any).quotes?.get(s)
			if (dbCached && differenceInSeconds(new Date(), new Date(dbCached.asOf)) <= cacheTtlSeconds) {
				setCachedQuote(dbCached, cacheTtlSeconds)
				trackMetric({ name: 'quote.cache.db.hit', value: 1, tags: { symbol: s } })
				return dbCached
			}
			trackMetric({ name: 'quote.cache.db.miss', value: 1, tags: { symbol: s } })
		} catch {}
	}
	// Use unified provider if no custom provider is set
	if (!provider) {
		provider = unifiedQuote
	}
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
		setCachedQuote(q, cacheTtlSeconds)
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

export function getLocalCachedQuote(symbol: string): PriceQuote | undefined {
	return getCachedQuote(symbol) || undefined
}

export function getEffectivePrice(quote: PriceQuote): number {
	// Fallback to prevClose when market closed or last unavailable
	if (quote.last != null) return quote.last
	if (quote.prevClose != null) return quote.prevClose
	return 0
}

export async function getQuotesBatched(symbols: string[], cacheTtlSeconds = cacheTtlSecondsDefault): Promise<Map<string, PriceQuote>> {
	const unique = Array.from(new Set(symbols.map((s) => tickerSchema.parse(s))))
	
	// Try cache first
	const cachedQuotes = getCachedQuotes(unique)
	const toFetch: string[] = []
	
	for (const s of unique) {
		const cached = cachedQuotes.get(s.toUpperCase())
		if (!cached || differenceInSeconds(new Date(), new Date(cached.asOf)) > cacheTtlSeconds) {
			toFetch.push(s)
		}
	}
	
	// If all found in cache, return early
	if (toFetch.length === 0) {
		trackMetric({ name: 'quote.batch.cache.full_hit', value: 1, tags: { count: unique.length.toString() } })
		return cachedQuotes
	}
	
	// Use unified batch provider for missing symbols
	if (toFetch.length > 0) {
		try {
			const fetchedQuotes = await unifiedQuoteBatch(toFetch)
			// Cache the fetched quotes
			setCachedQuotes(fetchedQuotes, cacheTtlSeconds)
			// Merge with cached quotes
			for (const [symbol, quote] of fetchedQuotes.entries()) {
				cachedQuotes.set(symbol, quote)
			}
			trackMetric({ name: 'quote.batch.partial_hit', value: 1, tags: { cached: (unique.length - toFetch.length).toString(), fetched: toFetch.length.toString() } })
		} catch (e) {
			trackError('quote.batch.error', e, { symbols: toFetch.join(',') })
			// Continue with partial results from cache
		}
	}
	
	return cachedQuotes
}


