import { describe, it, expect } from 'vitest'
import { avgCost, quantityOpen, marketValue, unrealizedPnL, realizedPnLFromClosedLots } from '../lib/math'
import type { Position } from '../features/portfolio/types'

const mk = (lots: Array<{ q: number; p: number; d?: string }>): Position => ({
  id: 'p1', ownerId: 'u', symbol: 'AAPL', type: 'stock', currency: 'USD', lots: lots.map((l, i) => ({ id: `l${i}`, quantity: l.q, price: l.p, date: l.d ?? '2024-01-01' })), privacy: { showPosition: true, showLots: true, showPnL: true }
})

describe('math', () => {
  it('quantityOpen sums quantities', () => {
    expect(quantityOpen(mk([{ q: 5, p: 100 }, { q: -2, p: 110 }]))).toBe(3)
  })
  it('avgCost handles zero quantity', () => {
    const { avg } = avgCost(mk([]))
    expect(avg).toBe(0)
  })
  it('marketValue multiplies qty by price', () => {
    const mv = marketValue(mk([{ q: 3, p: 10 }]), 20)
    expect(mv).toBe(60)
  })
  it('unrealizedPnL returns abs and pct', () => {
    const p = mk([{ q: 2, p: 50 }])
    const { abs, pct } = unrealizedPnL(p, 60)
    expect(abs).toBeCloseTo(20)
    expect(pct).toBeCloseTo(20)
  })
  it('realizedPnLFromClosedLots basic close against avg', () => {
    const p = mk([{ q: 5, p: 100 }, { q: -2, p: 110 }])
    expect(realizedPnLFromClosedLots(p)).toBeCloseTo(20)
  })
})


