import { db } from '../db'
import { feedPostCreateSchema } from '../../models/schemas'

export async function postBigMoveIfNeeded(portfolioId: string, symbol: string, percentChange: number, thresholdPercent: number = 5): Promise<void> {
    if (Math.abs(percentChange) < thresholdPercent) return
    const pf = await db.portfolios.get(portfolioId)
    if (!pf) return
    const userId = pf.userId
    const day = new Date().toISOString().slice(0, 10)
    const key = `bigmove:${userId}:${symbol}:${day}`
    const existing = await db.feedPosts.where('userId').equals(userId).and((p) => p.dedupeKey === key).first()
    if (existing) return
    const post = feedPostCreateSchema.parse({
        id: `fp-big-${userId}-${symbol}-${day}`,
        userId,
        createdAt: new Date().toISOString(),
        type: 'note',
        symbol,
        summary: `${symbol} moved ${percentChange.toFixed(2)}% today`,
        dedupeKey: key,
    })
    await db.feedPosts.put(post)
}


