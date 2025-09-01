import type { PriceQuote, MarketHoursState } from '../../../models/types'

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY
const BASE_URL = 'https://www.alphavantage.co/query'

interface AlphaVantageQuoteResponse {
	'Global Quote': {
		'01. symbol': string
		'02. open': string
		'03. high': string
		'04. low': string
		'05. price': string
		'06. volume': string
		'07. latest trading day': string
		'08. previous close': string
		'09. change': string
		'10. change percent': string
	}
}

function determineMarketState(): MarketHoursState {
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

export async function alphaVantageQuote(symbol: string): Promise<PriceQuote> {
	if (!API_KEY) {
		throw new Error('Alpha Vantage API key not configured')
	}
	
	try {
		const params = new URLSearchParams({
			function: 'GLOBAL_QUOTE',
			symbol: symbol.toUpperCase(),
			apikey: API_KEY
		})
		
		const response = await fetch(`${BASE_URL}?${params}`)
		
		if (!response.ok) {
			throw new Error(`Alpha Vantage API error: ${response.status}`)
		}
		
		const data = await response.json() as AlphaVantageQuoteResponse
		
		// Check for API errors
		if ('Error Message' in data) {
			throw new Error(`Invalid symbol: ${symbol}`)
		}
		
		if ('Note' in data) {
			throw new Error('Alpha Vantage API rate limit exceeded')
		}
		
		if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
			throw new Error(`No data available for symbol: ${symbol}`)
		}
		
		const quote = data['Global Quote']
		
		return {
			symbol: symbol.toUpperCase(),
			last: parseFloat(quote['05. price']),
			prevClose: parseFloat(quote['08. previous close']),
			asOf: new Date().toISOString(),
			currency: 'USD',
			marketState: determineMarketState()
		}
	} catch (error) {
		console.error('Alpha Vantage API error:', error)
		throw error instanceof Error ? error : new Error('Failed to fetch quote from Alpha Vantage')
	}
}


