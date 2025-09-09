import { create } from 'zustand'
import { newsDB } from '@/db/newsDexie'
import type { DailyBrief, MarketCard, RankingRow, Headline } from '@/types/research'

type Filters = { scope: 'all'|'holdings'|'pinned'; sector?: string; window?: '24h'|'7d' }
type Status = 'idle'|'loading'|'ready'|'error'

interface NewsState {
  brief?: DailyBrief
  snapshot: MarketCard[]
  rankings: RankingRow[]
  headlines: Headline[]
  filters: Filters
  status: Status
  lastUpdated?: string
  loadBrief: () => Promise<void>
  loadSnapshot: () => Promise<void>
  loadRankings: (tab?: 'momentum'|'volume'|'buzz'|'composite') => Promise<void>
  loadHeadlines: () => Promise<void>
  setFilters: (f: Partial<Filters>) => void
}

async function safeJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  try { return JSON.parse(text) as T } catch { throw new Error('Bad JSON') }
}

export const useNews = create<NewsState>((set, get) => ({
  brief: undefined,
  snapshot: [],
  rankings: [],
  headlines: [],
  filters: { scope: 'holdings', window: '24h' },
  status: 'idle',
  lastUpdated: undefined,

  setFilters: (f) => set({ filters: { ...get().filters, ...f } }),

  loadBrief: async () => {
    set({ status: 'loading' })
    try {
      const res = await fetch('/api/research/daily-brief')
      if (!res.ok) throw new Error(String(res.status))
      const data = await safeJson<DailyBrief>(res)
      set({ brief: data, status: 'ready', lastUpdated: new Date().toISOString() })
      try { await newsDB.briefCache.put(data) } catch {}
    } catch (e) {
      const cached = await newsDB.briefCache.limit(1).reverse().toArray()
      if (cached[0]) set({ brief: cached[0], status: 'ready' })
      else set({ status: 'error' })
    }
  },

  loadSnapshot: async () => {
    set({ status: 'loading' })
    try {
      const res = await fetch('/api/market/snapshot?tickers=SPY,QQQ,DIA')
      if (!res.ok) throw new Error(String(res.status))
      const data = await safeJson<MarketCard[]>(res)
      set({ snapshot: data, status: 'ready', lastUpdated: new Date().toISOString() })
      try { await newsDB.snapshotCache.bulkPut(data) } catch {}
    } catch (e) {
      const cached = await newsDB.snapshotCache.toArray()
      if (cached?.length) set({ snapshot: cached, status: 'ready' })
      else set({ status: 'error' })
    }
  },

  loadRankings: async () => {
    try {
      const res = await fetch('/api/research/rankings?universe=holdings&limit=20')
      if (!res.ok) throw new Error(String(res.status))
      const data = await safeJson<RankingRow[]>(res)
      set({ rankings: data })
      try { await newsDB.rankingsCache.bulkPut(data) } catch {}
    } catch (e) {
      const cached = await newsDB.rankingsCache.toArray()
      if (cached?.length) set({ rankings: cached })
    }
  },

  loadHeadlines: async () => {
    const { filters } = get()
    const params = new URLSearchParams()
    if (filters.scope) params.set('scope', filters.scope)
    if (filters.window) params.set('window', filters.window)
    try {
      const res = await fetch(`/api/news/fetch?${params.toString()}`)
      if (!res.ok) throw new Error(String(res.status))
      const data = await safeJson<Headline[]>(res)
      set({ headlines: data })
      try { await newsDB.newsCache.bulkPut(data) } catch {}
    } catch (e) {
      const cached = await newsDB.newsCache.orderBy('published_at').reverse().limit(200).toArray()
      if (cached?.length) set({ headlines: cached })
    }
  },
}))

