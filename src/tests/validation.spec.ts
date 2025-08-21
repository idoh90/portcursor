import { describe, it, expect } from 'vitest'
import { portfolioCreateSchema, tickerSchema, lotCreateSchema } from '../models/schemas'

describe('validation', () => {
	it('ticker uppercases and validates', () => {
		const s = tickerSchema.parse('aapl')
		expect(s).toBe('AAPL')
	})

	it('portfolio pinned max 5', () => {
		expect(() => portfolioCreateSchema.parse({
			id: 'p1', userId: 'u1', name: 'Main', currency: 'USD', visibility: 'public', pinnedSymbols: ['A','B','C','D','E','F'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
		})).toThrow()
	})

	it('lot quantity positive', () => {
		expect(() => lotCreateSchema.parse({ id: 'l1', positionId: 'pos1', side: 'buy', quantity: 0, price: 10, date: new Date().toISOString() })).toThrow()
	})
})


