export interface Headline {
  id: string
  title: string
  source: string
  url: string
  published_at: string // ISO 8601
  tickers: string[]
  summary?: string
}

export interface MarketCard {
  symbol: string
  price: number
  changePctDay: number
  changePct30d: number
  volume?: number
  avgVolume30d?: number
  spark?: number[] // last N closes
}

export interface RankingRow {
  symbol: string
  momentum30d: number // 0..100
  volumeSurge: number // 0..100
  newsBuzz: number // 0..100
  composite: number // 0..100
}

export interface DailyBrief {
  asOf: string // ISO date
  overviewBullets: string[]
  watchlist: string[]
  keyStories: { title: string; takeaway: string }[]
}