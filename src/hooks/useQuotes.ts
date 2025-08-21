import { useQuery, useQueries } from '@tanstack/react-query'
import { getQuote } from '../services/pricing/priceService'

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
	const queries = useQueries({
		queries: symbols.map((s) => ({
			queryKey: ['quote', s],
			queryFn: () => getQuote(s),
			staleTime: 15_000,
			refetchInterval: 30_000,
			retry: 2,
		}))
	})
	const map = new Map<string, ReturnType<typeof useQuery>['data']>()
	queries.forEach((q, i) => {
		map.set(symbols[i], q.data)
	})
	return map
}


