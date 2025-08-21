import { describe, it, expect } from 'vitest'
import { computeDividendYieldPercent, computeTrailing12MDividendPerShare, computeOptionExpirationPL } from '../services/positions/corpActions'

describe('Corporate actions & dividends', () => {
	it('TTM dividends and yield', () => {
		const now = '2024-12-31T00:00:00.000Z'
		const divs = [
			{ id: 'd1', positionId: 'pos', exDate: '2024-01-01T00:00:00.000Z', amountPerShare: 0.5, currency: 'USD' },
			{ id: 'd2', positionId: 'pos', exDate: '2024-04-01T00:00:00.000Z', amountPerShare: 0.5, currency: 'USD' },
			{ id: 'd3', positionId: 'pos', exDate: '2024-07-01T00:00:00.000Z', amountPerShare: 0.5, currency: 'USD' },
			{ id: 'd4', positionId: 'pos', exDate: '2024-10-01T00:00:00.000Z', amountPerShare: 0.5, currency: 'USD' },
		] as any
		const ttm = computeTrailing12MDividendPerShare(divs, now)
		expect(ttm).toBeCloseTo(2)
		const y = computeDividendYieldPercent(divs, now, 100)
		expect(y).toBeCloseTo(2)
	})

	it('option expiration P/L', () => {
		const lots = [
			{ id: '1', positionId: 'op', side: 'buy', quantity: 1, price: 2, date: '2024-01-01T00:00:00.000Z' },
		]
		expect(computeOptionExpirationPL(lots as any, true)).toBeCloseTo(-2)
		expect(computeOptionExpirationPL(lots as any, false)).toBeCloseTo(2)
	})
})


