import { describe, it, expect } from 'vitest'
import { computePositionMetrics, computePortfolioMetrics, applyStockSplit } from '../services/positions/plEngine'

const lots = [
	{ id: '1', positionId: 'p', side: 'buy', quantity: 10, price: 100, date: '2020-01-01T00:00:00.000Z' },
	{ id: '2', positionId: 'p', side: 'buy', quantity: 10, price: 120, date: '2020-01-02T00:00:00.000Z' },
	{ id: '3', positionId: 'p', side: 'sell', quantity: 5, price: 130, date: '2020-01-03T00:00:00.000Z' },
]

describe('Step 4 engines', () => {
	it('position metrics FIFO', () => {
		const m = computePositionMetrics(lots, { last: 125, prevClose: 123 }, 'FIFO')
		expect(m.quantity).toBe(15)
		expect(m.avgCost).toBeGreaterThan(0)
		expect(m.realizedPL).toBeCloseTo(5 * (130 - 100))
		// unrealized sign sanity
		expect(typeof m.unrealizedPL).toBe('number')
	})

	it('portfolio aggregation', () => {
		const result = computePortfolioMetrics([
			{ position: { id: 'pos', portfolioId: 'pf', symbol: 'AAPL', type: 'stock', status: 'open', createdAt: '0', updatedAt: '0' }, lots, quote: { last: 125, prevClose: 123 } },
		], { id: 'pf', userId: 'u', name: 'Main', currency: 'USD', visibility: 'public', pinnedSymbols: [], createdAt: '0', updatedAt: '0' })
		expect(result.totalRealized).toBeGreaterThanOrEqual(0)
		expect(result.totalUnrealized).toBeTypeOf('number')
		expect(result.totalToday).toBeTypeOf('number')
	})

	it('stock split adjusts lots', () => {
		const out = applyStockSplit(lots, 2, 1)
		expect(out[0].quantity).toBe(20)
		expect(out[0].price).toBe(50)
	})
})


