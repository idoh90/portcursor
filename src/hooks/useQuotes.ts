import { useQuery } from '@tanstack/react-query'
import { getQuote, getQuotesBatched } from '../services/pricing/priceService'
import type { PriceQuote } from '../models/types'

export function useQuote(symbol: string) {
	return useQuery({
		queryKey: ['quote', symbol],
		queryFn: () => getQuote(symbol),
		staleTime: 15_000,
		refetchInterval: 30_000,
		retry: 2,
	})
}

export function useQuotesBatch(symbols: string[]) {
	// Single batched query to reduce API calls
	const { data } = useQuery<Map<string, PriceQuote>>({
		queryKey: ['quotes', ...symbols],
		queryFn: () => getQuotesBatched(symbols),
		staleTime: 15_000,
		refetchInterval: 30_000,
		retry: 2,
	})
	return data ?? new Map<string, PriceQuote>()
}


