import { db } from './db'
import type { Portfolio, Position, Lot, User } from '../models/types'
import { portfolioCreateSchema, positionCreateSchema, lotCreateSchema, userCreateSchema } from '../models/schemas'

function now() { return new Date().toISOString() }

export async function seedDev(): Promise<void> {
	await db.transaction('rw', db.users, db.portfolios, db.positions, db.lots, async () => {
		const users: Array<User & { pinHash?: string } & { displayName: string; id: string }> = [
			{ id: 'u-ido', displayName: 'Ido', createdAt: now() },
			{ id: 'u-megi', displayName: 'Megi', createdAt: now() },
			{ id: 'u-om', displayName: 'Om', createdAt: now() },
		]
		for (const u of users) {
			// Normalize display name uniqueness to lowercase
			const record = { id: u.id, displayName: u.displayName.toLowerCase(), createdAt: u.createdAt }
			userCreateSchema.parse(record)
			await db.users.put({ ...record, pinHash: '' })
		}

		const p1: Portfolio = {
			id: 'pf-ido-1', userId: 'u-ido', name: 'Main', currency: 'USD', visibility: 'public', pinnedSymbols: ['AAPL', 'MSFT'], createdAt: now(), updatedAt: now()
		}
		portfolioCreateSchema.parse(p1)
		await db.portfolios.put(p1)

		const pos1: Position = { id: 'pos-aapl', portfolioId: p1.id, symbol: 'AAPL', type: 'stock', status: 'open', createdAt: now(), updatedAt: now() }
		positionCreateSchema.parse(pos1)
		await db.positions.put(pos1)
		const lots: Lot[] = [
			{ id: 'lot1', positionId: 'pos-aapl', side: 'buy', quantity: 10, price: 150, date: now() },
			{ id: 'lot2', positionId: 'pos-aapl', side: 'buy', quantity: 5, price: 160, date: now() }
		]
		for (const l of lots) {
			lotCreateSchema.parse(l)
			await db.lots.put(l)
		}
	})
}


