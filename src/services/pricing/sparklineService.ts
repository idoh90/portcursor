import { differenceInMinutes } from 'date-fns'
import { getCachedQuote, getQuote, getEffectivePrice } from './priceService'

type SparkKey = string

type SparkCacheEntry = {
	values: number[]
	asOf: string
}

const cache = new Map<SparkKey, SparkCacheEntry>()
const ttlMinutesDefault = 30

function keyOf(symbol: string, windowDays: 7 | 30): SparkKey {
	return `${symbol.toUpperCase()}:${windowDays}`
}

export async function getSparkline(symbol: string, windowDays: 7 | 30, ttlMinutes = ttlMinutesDefault): Promise<number[]> {
	const key = keyOf(symbol, windowDays)
	const cached = cache.get(key)
	if (cached && differenceInMinutes(new Date(), new Date(cached.asOf)) <= ttlMinutes) {
		return cached.values
	}
	// No historical provider yet: fallback to last/prevClose and synthesize a flat series
	let price = getCachedQuote(symbol)
	try {
		if (!price) price = await getQuote(symbol)
	} catch {
		// swallow; will fallback below
	}
	const base = price ? getEffectivePrice(price) : 0
	const length = windowDays === 7 ? 7 : 30
	const series = Array.from({ length }, () => base)
	cache.set(key, { values: series, asOf: new Date().toISOString() })
	return series
}


