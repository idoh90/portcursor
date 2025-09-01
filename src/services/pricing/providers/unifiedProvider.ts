import type { PriceQuote } from '../../../models/types'
import { alphaVantageQuote } from './alphaVantage'
import { polygonQuote, polygonQuoteBatch } from './polygon'

const PRIMARY_PROVIDER = import.meta.env.VITE_PRIMARY_PROVIDER || 'polygon'
const FALLBACK_PROVIDER = import.meta.env.VITE_FALLBACK_PROVIDER || 'alphavantage'

// Cache for provider health status
const providerHealth = new Map<string, { healthy: boolean; checkedAt: number }>()
const HEALTH_CHECK_INTERVAL = 60000 // 1 minute

function isProviderHealthy(provider: string): boolean {
	const health = providerHealth.get(provider)
	if (!health) return true // Assume healthy if not checked
	
	const now = Date.now()
	if (now - health.checkedAt > HEALTH_CHECK_INTERVAL) {
		return true // Re-check if interval passed
	}
	
	return health.healthy
}

function markProviderHealth(provider: string, healthy: boolean) {
	providerHealth.set(provider, {
		healthy,
		checkedAt: Date.now()
	})
}

async function getQuoteWithFallback(
	symbol: string,
	primaryFn: (symbol: string) => Promise<PriceQuote>,
	fallbackFn: (symbol: string) => Promise<PriceQuote>,
	primaryName: string,
	fallbackName: string
): Promise<PriceQuote> {
	// Try primary provider if healthy
	if (isProviderHealthy(primaryName)) {
		try {
			const quote = await primaryFn(symbol)
			markProviderHealth(primaryName, true)
			return quote
		} catch (error) {
			console.warn(`Primary provider (${primaryName}) failed for ${symbol}:`, error)
			markProviderHealth(primaryName, false)
		}
	}
	
	// Try fallback provider
	if (isProviderHealthy(fallbackName)) {
		try {
			const quote = await fallbackFn(symbol)
			markProviderHealth(fallbackName, true)
			return quote
		} catch (error) {
			console.warn(`Fallback provider (${fallbackName}) failed for ${symbol}:`, error)
			markProviderHealth(fallbackName, false)
			throw error
		}
	}
	
	// Both providers are marked unhealthy, but try primary again
	try {
		const quote = await primaryFn(symbol)
		markProviderHealth(primaryName, true)
		return quote
	} catch (error) {
		throw new Error(`All providers failed for ${symbol}`)
	}
}

export async function unifiedQuote(symbol: string): Promise<PriceQuote> {
	const providers = {
		polygon: polygonQuote,
		alphavantage: alphaVantageQuote
	}
	
	const primaryFn = providers[PRIMARY_PROVIDER as keyof typeof providers] || polygonQuote
	const fallbackFn = providers[FALLBACK_PROVIDER as keyof typeof providers] || alphaVantageQuote
	
	return getQuoteWithFallback(symbol, primaryFn, fallbackFn, PRIMARY_PROVIDER, FALLBACK_PROVIDER)
}

export async function unifiedQuoteBatch(symbols: string[]): Promise<Map<string, PriceQuote>> {
	// Try Polygon batch API first if it's the primary provider
	if (PRIMARY_PROVIDER === 'polygon' && isProviderHealthy('polygon')) {
		try {
			const results = await polygonQuoteBatch(symbols)
			markProviderHealth('polygon', true)
			
			// Check if we got all symbols
			const missingSymbols = symbols.filter(s => !results.has(s.toUpperCase()))
			
			// Fetch missing symbols individually with fallback
			if (missingSymbols.length > 0) {
				for (const symbol of missingSymbols) {
					try {
						const quote = await unifiedQuote(symbol)
						results.set(symbol.toUpperCase(), quote)
					} catch {
						// Skip failed symbols
					}
				}
			}
			
			return results
		} catch (error) {
			console.warn('Polygon batch API failed:', error)
			markProviderHealth('polygon', false)
		}
	}
	
	// Fallback to individual requests
	const results = new Map<string, PriceQuote>()
	
	// Process in smaller batches to avoid rate limits
	const BATCH_SIZE = 5
	const DELAY_BETWEEN_BATCHES = 1000 // 1 second
	
	for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
		const batch = symbols.slice(i, i + BATCH_SIZE)
		
		// Process batch in parallel
		const batchPromises = batch.map(async (symbol) => {
			try {
				const quote = await unifiedQuote(symbol)
				return { symbol: symbol.toUpperCase(), quote }
			} catch {
				return null
			}
		})
		
		const batchResults = await Promise.all(batchPromises)
		
		for (const result of batchResults) {
			if (result) {
				results.set(result.symbol, result.quote)
			}
		}
		
		// Add delay between batches to respect rate limits
		if (i + BATCH_SIZE < symbols.length) {
			await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
		}
	}
	
	return results
}
