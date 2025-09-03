import Dexie, { Table } from 'dexie'
import type { Headline, MarketCard, RankingRow, DailyBrief } from '@/types/research'

export class NewsDB extends Dexie {
  newsCache!: Table<Headline, string>
  snapshotCache!: Table<MarketCard, string>
  rankingsCache!: Table<RankingRow, string>
  briefCache!: Table<DailyBrief, string>

  constructor() {
    super('NewsDB')
    this.version(1).stores({
      newsCache: 'id,published_at',
      snapshotCache: 'symbol',
      rankingsCache: 'symbol',
      briefCache: 'asOf',
    })
  }
}

export const newsDB = new NewsDB()

