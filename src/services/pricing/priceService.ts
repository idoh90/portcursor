import { differenceInSeconds } from 'date-fns'
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
		return q
	} catch (e) {
		failureCount += 1
		if (failureCount >= circuitThreshold) {
			circuitOpenUntil = Date.now() + circuitOpenMs
		}
		if (cached) return cached
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


