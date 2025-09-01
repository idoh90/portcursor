import { create } from 'zustand'
import type { Position } from './types'
import { db } from '../../services/db'
import { addLot as repoAddLot, deleteLot as repoDeleteLot, createPosition as repoCreatePosition, updatePosition as repoUpdatePosition, listLots as repoListLots } from '../../services/repos/positionRepo'

type PortfolioState = {
  positions: Position[]
  load: () => Promise<void>
  addPosition: (p: Position) => Promise<void>
  addLot: (positionId: string, quantity: number, price: number) => Promise<void>
  removeLot: (lotId: string) => Promise<void>
  closePosition: (positionId: string) => Promise<void>
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  positions: [],
  async load() {
    const rows = await db.positions.toArray()
    set({ positions: rows as any })
  },
  async addPosition(p) {
    await repoCreatePosition(p as any)
    const rows = await db.positions.toArray()
    set({ positions: rows as any })
  },
  async addLot(positionId, quantity, price) {
    const lot = { id: `lot-${Math.random().toString(36).slice(2,8)}`, positionId, side: quantity >= 0 ? 'buy' : 'sell', quantity: Math.abs(quantity), price, date: new Date().toISOString() }
    await repoAddLot(lot as any)
  },
  async removeLot(lotId) {
    await repoDeleteLot(lotId)
  },
  async closePosition(positionId) {
    await repoUpdatePosition(positionId, { status: 'closed' } as any)
    const rows = await db.positions.toArray()
    set({ positions: rows as any })
  },
}))


