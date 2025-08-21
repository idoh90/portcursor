import { db } from '../db'

export async function togglePinnedSymbol(portfolioId: string, symbol: string): Promise<string[]> {
    const pf = await db.portfolios.get(portfolioId)
    if (!pf) return []
    const set = new Set(pf.pinnedSymbols)
    if (set.has(symbol)) {
        set.delete(symbol)
    } else {
        if (set.size >= 5) throw new Error('Maximum 5 pinned symbols')
        set.add(symbol)
    }
    const next = Array.from(set)
    await db.portfolios.put({ ...pf, pinnedSymbols: next, updatedAt: new Date().toISOString() })
    await db.auditLogs.put({ id: `pin:${pf.userId}:${Date.now()}`, userId: pf.userId, action: 'pinned.toggle', details: { portfolioId, symbol, pinned: set.has(symbol) }, ts: new Date().toISOString() } as any)
    return next
}

export async function reorderPinnedSymbols(portfolioId: string, nextOrder: string[]): Promise<void> {
    const pf = await db.portfolios.get(portfolioId)
    if (!pf) return
    if (nextOrder.length > 5) throw new Error('Maximum 5 pinned symbols')
    await db.portfolios.put({ ...pf, pinnedSymbols: nextOrder, updatedAt: new Date().toISOString() })
    await db.auditLogs.put({ id: `pinReorder:${pf.userId}:${Date.now()}`, userId: pf.userId, action: 'pinned.reorder', details: { portfolioId, nextOrder }, ts: new Date().toISOString() } as any)
}


