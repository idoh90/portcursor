import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyBrief, MarketCard, RankingRow, Headline } from '@/types/research'

/**
 * Filters used to fetch and display headlines
 */
export type Filters = {
  scope: 'all' | 'holdings' | 'pinned'
  sector?: string
  window?: '24h' | '7d'
}

export type Status = 'idle' | 'loading' | 'ready' | 'error'

interface NewsState {
  brief?: DailyBrief
  snapshot: MarketCard[]
  rankings: RankingRow[]
  headlines: Headline[]
  filters: Filters
  status: Status
  setFilters: (f: Partial<Filters>) => void
  loadBrief: () => Promise<void>
  loadSnapshot: () => Promise<void>
  loadRankings: (tab?: 'momentum' | 'volume' | 'buzz' | 'composite') => Promise<void>
  loadHeadlines: () => Promise<void>
}

export const useNews = create<NewsState>()(
  persist(
    (set, get) => ({
      brief: undefined,
      snapshot: [],
      rankings: [],
      headlines: [],
      filters: { scope: 'holdings', window: '24h' },
      status: 'idle',

      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),

      loadBrief: async () => {
        set({ status: 'loading' })
        try {
          const res = await fetch('/api/research/daily-brief')
          if (!res.ok) throw new Error('Failed to load brief')
          const data: DailyBrief = await res.json()
          set({ brief: data, status: 'ready' })
        } catch (err) {
          console.error(err)
          set({ status: 'error' })
        }
      },

      loadSnapshot: async () => {
        set({ status: 'loading' })
        try {
          const res = await fetch('/api/market/snapshot?tickers=SPY,QQQ,DIA')
          if (!res.ok) throw new Error('Failed to load snapshot')
          const data: MarketCard[] = await res.json()
          set({ snapshot: data, status: 'ready' })
        } catch (err) {
          console.error(err)
          set({ status: 'error' })
        }
      },

      loadRankings: async () => {
        try {
          const res = await fetch('/api/research/rankings?universe=holdings&limit=20')
          if (!res.ok) throw new Error('Failed to load rankings')
          const data: RankingRow[] = await res.json()
          set({ rankings: data })
        } catch (err) {
          console.error(err)
        }
      },

      loadHeadlines: async () => {
        try {
          const { filters } = get()
          const params = new URLSearchParams()
          if (filters.scope) params.set('scope', filters.scope)
          if (filters.window) params.set('window', filters.window)
          const res = await fetch(`/api/news/fetch?${params.toString()}`)
          if (!res.ok) throw new Error('Failed to load headlines')
          const data: Headline[] = await res.json()
          set({ headlines: data })
        } catch (err) {
          console.error(err)
        }
      },
    }),
    {
      name: 'newsSlice',
      partialize: (state) => ({
        brief: state.brief,
        snapshot: state.snapshot,
        rankings: state.rankings,
        headlines: state.headlines,
        filters: state.filters,
      }),
    },
  ),
)