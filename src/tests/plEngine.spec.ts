import { describe, it, expect } from 'vitest'
import { computeRealizedPLFIFO, computeWeightedAverageCost } from '../services/repos/plHelpers'

describe('P/L helpers', () => {
	it('weighted average cost', () => {
		const lots = [
			{ id: '1', positionId: 'p', side: 'buy', quantity: 10, price: 100, date: '2020-01-01T00:00:00.000Z' },
			{ id: '2', positionId: 'p', side: 'buy', quantity: 10, price: 120, date: '2020-01-02T00:00:00.000Z' },
		]
		const res = computeWeightedAverageCost(lots)
		expect(res.totalQuantity).toBe(20)
		expect(res.weightedAvgCost).toBeCloseTo(110)
	})

	it('FIFO realized P/L on partial sells', () => {
		const lots = [
			{ id: '1', positionId: 'p', side: 'buy', quantity: 10, price: 100, date: '2020-01-01T00:00:00.000Z' },
			{ id: '2', positionId: 'p', side: 'buy', quantity: 10, price: 120, date: '2020-01-02T00:00:00.000Z' },
			{ id: '3', positionId: 'p', side: 'sell', quantity: 15, price: 130, date: '2020-01-03T00:00:00.000Z' },
		]
		const pl = computeRealizedPLFIFO(lots)
		expect(pl).toBeCloseTo(15 * 130 - (10 * 100 + 5 * 120))
	})
})


