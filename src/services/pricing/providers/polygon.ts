import type { PriceQuote } from '../../../models/types'

export async function polygonQuote(symbol: string): Promise<PriceQuote> {
	// Stub: Replace with real Polygon.io implementation
	return {
		symbol,
		last: null,
		prevClose: null,
		asOf: new Date().toISOString(),
		currency: 'USD',
		marketState: 'unknown',
	}
}


