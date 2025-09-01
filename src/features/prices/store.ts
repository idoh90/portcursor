import { create } from 'zustand'
import { fetchLivePrice } from './service'

type Quote = { price: number; prevClose: number; updatedAt: number }

type PriceState = {
  quotes: Record<string, Quote>
  ttlMs: number
  getPrice: (symbol: string) => Promise<Quote>
}

export const usePriceStore = create<PriceState>((set, get) => ({
  quotes: {},
  ttlMs: 30_000,
  async getPrice(symbol) {
    const key = symbol.toUpperCase()
    const existing = get().quotes[key]
    const now = Date.now()
    if (existing && now - existing.updatedAt < get().ttlMs) return existing
    const fresh = await fetchLivePrice(key)
    set(s => ({ quotes: { ...s.quotes, [key]: fresh } }))
    return fresh
  },
}))


