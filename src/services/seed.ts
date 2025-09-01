import { db } from './db'
import type { Portfolio, Position, Lot, User } from '../models/types'
import { portfolioCreateSchema, positionCreateSchema, lotCreateSchema, userCreateSchema } from '../models/schemas'

// Simple hash function for demo purposes (not secure, just for development)
async function simpleHash(input: string): Promise<string> {
	const encoder = new TextEncoder()
	const data = encoder.encode(input)
	const hashBuffer = await crypto.subtle.digest('SHA-256', data)
	const hashArray = Array.from(new Uint8Array(hashBuffer))
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function now() { return new Date().toISOString() }

export async function clearDatabase(): Promise<void> {
	try {
		console.log('Clearing database...')
		await db.users.clear()
		await db.portfolios.clear()
		await db.positions.clear()
		await db.lots.clear()
		console.log('Database cleared successfully')
	} catch (error) {
		console.error('Error clearing database:', error)
	}
}

export async function seedDev(): Promise<void> {
	try {
		console.log('Starting seed data creation...')
		
		// Check if users already exist
		const existingUsers = await db.users.toArray()
		console.log('Existing users:', existingUsers.length)
		
		if (existingUsers.length > 0) {
			console.log('Demo users already exist, skipping seed')
			return
		}
		
		await db.transaction('rw', db.users, db.portfolios, db.positions, db.lots, async () => {
			// Create a default PIN hash for demo users (PIN: 0000)
			const demoPin = '0000'
			const demoPinHash = await simpleHash(demoPin)
			console.log('Created PIN hash for demo users')
			
			const users: Array<User & { pinHash?: string } & { displayName: string; id: string }> = [
				{ id: 'u-ido', displayName: 'Ido', createdAt: now() },
				{ id: 'u-megi', displayName: 'Megi', createdAt: now() },
				{ id: 'u-om', displayName: 'Om', createdAt: now() },
			]
			
			for (const u of users) {
				// Normalize display name uniqueness to lowercase
				const record = { id: u.id, displayName: u.displayName.toLowerCase(), createdAt: u.createdAt }
				userCreateSchema.parse(record)
				await db.users.put({ ...record, pinHash: demoPinHash })
				console.log('Created user:', u.id)
			}

		const p1: Portfolio = {
			id: 'pf-ido-1', userId: 'u-ido', name: 'Main', currency: 'USD', visibility: 'public', pinnedSymbols: ['SPY', 'MSFT', 'PLTR'], createdAt: now(), updatedAt: now()
		}
		portfolioCreateSchema.parse(p1)
		await db.portfolios.put(p1)
		// Additional demo portfolios
		const p2: Portfolio = { id: 'pf-megi-1', userId: 'u-megi', name: 'Main', currency: 'USD', visibility: 'public', pinnedSymbols: ['AAPL', 'NVDA'], createdAt: now(), updatedAt: now() }
		const p3: Portfolio = { id: 'pf-om-1', userId: 'u-om', name: 'Main', currency: 'USD', visibility: 'public', pinnedSymbols: ['AMZN'], createdAt: now(), updatedAt: now() }
		portfolioCreateSchema.parse(p2)
		portfolioCreateSchema.parse(p3)
		await db.portfolios.put(p2)
		await db.portfolios.put(p3)

		const demoPositions: Position[] = [
			{ id: 'pos-spy', portfolioId: p1.id, symbol: 'SPY', type: 'stock', status: 'open', createdAt: now(), updatedAt: now() },
			{ id: 'pos-msft', portfolioId: p1.id, symbol: 'MSFT', type: 'stock', status: 'open', createdAt: now(), updatedAt: now() },
			{ id: 'pos-pltr', portfolioId: p1.id, symbol: 'PLTR', type: 'stock', status: 'open', createdAt: now(), updatedAt: now() },
			{ id: 'pos-aapl', portfolioId: p2.id, symbol: 'AAPL', type: 'stock', status: 'open', createdAt: now(), updatedAt: now() },
			{ id: 'pos-nvda', portfolioId: p2.id, symbol: 'NVDA', type: 'stock', status: 'open', createdAt: now(), updatedAt: now() },
			{ id: 'pos-amzn', portfolioId: p3.id, symbol: 'AMZN', type: 'stock', status: 'open', createdAt: now(), updatedAt: now() },
		]
		for (const p of demoPositions) { positionCreateSchema.parse(p); await db.positions.put(p) }
		const lots: Lot[] = [
			{ id: 'lot-spy-1', positionId: 'pos-spy', side: 'buy', quantity: 5, price: 500, date: now() },
			{ id: 'lot-spy-2', positionId: 'pos-spy', side: 'buy', quantity: 3, price: 505, date: now() },
			{ id: 'lot-msft-1', positionId: 'pos-msft', side: 'buy', quantity: 4, price: 380, date: now() },
			{ id: 'lot-pltr-1', positionId: 'pos-pltr', side: 'buy', quantity: 12, price: 28, date: now() },
			{ id: 'lot-aapl-1', positionId: 'pos-aapl', side: 'buy', quantity: 6, price: 190, date: now() },
			{ id: 'lot-nvda-1', positionId: 'pos-nvda', side: 'buy', quantity: 2, price: 1100, date: now() },
			{ id: 'lot-amzn-1', positionId: 'pos-amzn', side: 'buy', quantity: 3, price: 180, date: now() },
		]
		for (const l of lots) { lotCreateSchema.parse(l); await db.lots.put(l) }
		
		console.log('Seed data creation completed successfully!')
		})
	} catch (error) {
		console.error('Error creating seed data:', error)
		throw error
	}
}


