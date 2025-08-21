import type { PriceQuote } from '../../../models/types'

export async function alphaVantageQuote(symbol: string): Promise<PriceQuote> {
	// Stub: Replace with real Alpha Vantage implementation
	return {
		symbol,
		last: null,
		prevClose: null,
		asOf: new Date().toISOString(),
		currency: 'USD',
		marketState: 'unknown',
	}
}


