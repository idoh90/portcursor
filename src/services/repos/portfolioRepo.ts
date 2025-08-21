import { db } from '../db'
import type { Portfolio, Position } from '../../models/types'
import { portfolioCreateSchema, feedPostCreateSchema } from '../../models/schemas'

export async function createPortfolio(input: Portfolio): Promise<Portfolio> {
	const p = portfolioCreateSchema.parse(input)
	await db.portfolios.add(p)
	return p
}

export async function getPortfolio(id: string): Promise<Portfolio | undefined> {
	return db.portfolios.get(id)
}

export async function listPortfoliosByUser(userId: string): Promise<Portfolio[]> {
	return db.portfolios.where('userId').equals(userId).toArray()
}

export async function updatePortfolio(id: string, patch: Partial<Portfolio>): Promise<void> {
	await db.portfolios.update(id, patch)
}

export async function deletePortfolio(id: string): Promise<void> {
	await db.transaction('rw', db.portfolios, db.positions, db.lots, async () => {
		// Delete positions and lots under portfolio
		const posIds = (await db.positions.where('portfolioId').equals(id).toArray()).map((p) => p.id)
		for (const pid of posIds) {
			await db.lots.where('positionId').equals(pid).delete()
		}
		await db.positions.where('portfolioId').equals(id).delete()
		await db.portfolios.delete(id)
	})
}

export async function listPositions(portfolioId: string): Promise<Position[]> {
	return db.positions.where('portfolioId').equals(portfolioId).toArray()
}


