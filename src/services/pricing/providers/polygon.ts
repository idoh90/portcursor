import type { PriceQuote, MarketHoursState } from '../../../models/types'

const API_KEY = import.meta.env.VITE_POLYGON_API_KEY
const BASE_URL = 'https://api.polygon.io'

// Unused for now, but keeping for future real-time ticker endpoint
// interface PolygonTickerResponse {
// 	status: string
// 	results: {
// 		T: string // ticker
// 		c: number // close
// 		h: number // high
// 		l: number // low
// 		o: number // open
// 		v: number // volume
// 		vw: number // volume weighted average
// 		t: number // timestamp
// 		n: number // number of transactions
// 	}
// 	requestId: string
// }

interface PolygonPrevCloseResponse {
	status: string
	results: Array<{
		T: string // ticker
		c: number // close
		h: number // high
		l: number // low
		o: number // open
		v: number // volume
		vw: number // volume weighted average
		t: number // timestamp
		n: number // number of transactions
	}>
	requestId: string
}

interface PolygonMarketStatusResponse {
	status: string
	market: string
	serverTime: string
	exchanges: {
		nyse: string
		nasdaq: string
		otc: string
	}
	currencies: {
		fx: string
		crypto: string
	}
}

async function getMarketStatus(): Promise<MarketHoursState> {
	try {
		const response = await fetch(`${BASE_URL}/v1/marketstatus/now?apikey=${API_KEY}`)
		
		if (!response.ok) {
			return determineMarketStateByTime()
		}
		
		const data = await response.json() as PolygonMarketStatusResponse
		
		// Check NYSE and NASDAQ status
		const exchangeStatus = data.exchanges?.nyse || data.exchanges?.nasdaq
		
		if (exchangeStatus === 'open') return 'open'
		if (exchangeStatus === 'extended-hours') {
			const now = new Date()
			const hours = now.getUTCHours() - 5 // Convert to ET (simplified)
			return hours < 9 ? 'pre' : 'post'
		}
		if (exchangeStatus === 'closed') return 'closed'
		
		return 'unknown'
	} catch {
		return determineMarketStateByTime()
	}
}

function determineMarketStateByTime(): MarketHoursState {
	const now = new Date()
	const hours = now.getUTCHours()
	const minutes = now.getUTCMinutes()
	const day = now.getUTCDay()
	
	// Convert to ET (UTC-5 for EST, UTC-4 for EDT)
	// Simplified: using EST (UTC-5) for now
	const etHours = (hours - 5 + 24) % 24
	const etMinutes = minutes
	
	// Weekend check (Saturday = 6, Sunday = 0)
	if (day === 0 || day === 6) {
		return 'closed'
	}
	
	// Market hours: 9:30 AM - 4:00 PM ET
	const marketTime = etHours * 60 + etMinutes
	const marketOpen = 9 * 60 + 30  // 9:30 AM
	const marketClose = 16 * 60      // 4:00 PM
	const preMarketOpen = 4 * 60     // 4:00 AM
	const postMarketClose = 20 * 60  // 8:00 PM
	
	if (marketTime >= marketOpen && marketTime < marketClose) {
		return 'open'
	} else if (marketTime >= preMarketOpen && marketTime < marketOpen) {
		return 'pre'
	} else if (marketTime >= marketClose && marketTime < postMarketClose) {
		return 'post'
	} else {
		return 'closed'
	}
}

export async function polygonQuote(symbol: string): Promise<PriceQuote> {
	if (!API_KEY) {
		throw new Error('Polygon API key not configured')
	}
	
	try {
		const upperSymbol = symbol.toUpperCase()
		
		// Get real-time quote
		const [tickerResponse, prevCloseResponse, marketState] = await Promise.all([
			fetch(`${BASE_URL}/v2/aggs/ticker/${upperSymbol}/prev?apikey=${API_KEY}`),
			fetch(`${BASE_URL}/v2/aggs/ticker/${upperSymbol}/prev?apikey=${API_KEY}`),
			getMarketStatus()
		])
		
		if (!tickerResponse.ok) {
			if (tickerResponse.status === 403) {
				throw new Error('Polygon API key invalid or insufficient permissions')
			}
			if (tickerResponse.status === 429) {
				throw new Error('Polygon API rate limit exceeded')
			}
			throw new Error(`Polygon API error: ${tickerResponse.status}`)
		}
		
		const prevData = await prevCloseResponse.json() as PolygonPrevCloseResponse
		
		if (prevData.status !== 'OK' || !prevData.results || prevData.results.length === 0) {
			throw new Error(`No data available for symbol: ${symbol}`)
		}
		
		const prevResult = prevData.results[0]
		
		// For real-time data during market hours, we could use the snapshot endpoint
		// But for now, we'll use the previous close as both last and prevClose
		// This is because the free tier might have limitations
		let lastPrice = prevResult.c
		
		// Try to get more recent data if market is open
		if (marketState === 'open' || marketState === 'pre' || marketState === 'post') {
			try {
				const snapshotResponse = await fetch(
					`${BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers/${upperSymbol}?apikey=${API_KEY}`
				)
				
				if (snapshotResponse.ok) {
					const snapshotData = await snapshotResponse.json()
					if (snapshotData.status === 'OK' && snapshotData.ticker) {
						lastPrice = snapshotData.ticker.day?.c || snapshotData.ticker.prevDay?.c || lastPrice
					}
				}
			} catch {
				// Fallback to previous close if snapshot fails
			}
		}
		
		return {
			symbol: upperSymbol,
			last: lastPrice,
			prevClose: prevResult.c,
			asOf: new Date().toISOString(),
			currency: 'USD',
			marketState
		}
	} catch (error) {
		console.error('Polygon API error:', error)
		throw error instanceof Error ? error : new Error('Failed to fetch quote from Polygon')
	}
}

export async function polygonQuoteBatch(symbols: string[]): Promise<Map<string, PriceQuote>> {
	if (!API_KEY) {
		throw new Error('Polygon API key not configured')
	}
	
	const results = new Map<string, PriceQuote>()
	
	try {
		// Polygon supports batch requests via the snapshot endpoint
		const tickerList = symbols.map(s => s.toUpperCase()).join(',')
		const [snapshotResponse, marketState] = await Promise.all([
			fetch(`${BASE_URL}/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${tickerList}&apikey=${API_KEY}`),
			getMarketStatus()
		])
		
		if (!snapshotResponse.ok) {
			// Fallback to individual requests
			for (const symbol of symbols) {
				try {
					const quote = await polygonQuote(symbol)
					results.set(symbol.toUpperCase(), quote)
				} catch {
					// Skip failed symbols
				}
			}
			return results
		}
		
		const data = await snapshotResponse.json()
		
		if (data.status === 'OK' && data.tickers) {
			for (const ticker of data.tickers) {
				const symbol = ticker.ticker
				const lastPrice = ticker.day?.c || ticker.prevDay?.c || null
				const prevClose = ticker.prevDay?.c || null
				
				results.set(symbol, {
					symbol,
					last: lastPrice,
					prevClose,
					asOf: new Date().toISOString(),
					currency: 'USD',
					marketState
				})
			}
		}
		
		return results
	} catch (error) {
		console.error('Polygon batch API error:', error)
		// Fallback to individual requests
		for (const symbol of symbols) {
			try {
				const quote = await polygonQuote(symbol)
				results.set(symbol.toUpperCase(), quote)
			} catch {
				// Skip failed symbols
			}
		}
		return results
	}
}


