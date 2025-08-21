import { db } from '../db'
import type { Lot, Position } from '../../models/types'
import { lotCreateSchema, positionCreateSchema, feedPostCreateSchema } from '../../models/schemas'

export async function createPosition(input: Position): Promise<Position> {
	const p = positionCreateSchema.parse(input)
	await db.positions.add(p)
	// Auto-post: position added (best-effort)
	try {
		const pf = await db.portfolios.get(p.portfolioId)
		if (pf) {
			const post = feedPostCreateSchema.parse({
				id: `fp-${p.id}`,
				userId: pf.userId,
				createdAt: new Date().toISOString(),
				type: 'position_added',
				symbol: p.symbol,
				summary: `Opened ${p.symbol}`,
				dedupeKey: `position_added:${p.id}`,
			})
			await db.feedPosts.put(post)
		}
	} catch {}
	return p
}

export async function getPosition(id: string): Promise<Position | undefined> {
	return db.positions.get(id)
}

export async function updatePosition(id: string, patch: Partial<Position>): Promise<void> {
	await db.positions.update(id, patch)
	if (patch.status === 'closed') {
		try {
			const pos = await db.positions.get(id)
			if (pos) {
				const pf = await db.portfolios.get(pos.portfolioId)
				if (pf) {
					const post = feedPostCreateSchema.parse({
						id: `fp-close-${id}`,
						userId: pf.userId,
						createdAt: new Date().toISOString(),
						type: 'position_closed',
						symbol: pos.symbol,
						summary: `Closed ${pos.symbol}`,
						dedupeKey: `position_closed:${id}`,
					})
					await db.feedPosts.put(post)
				}
			}
		} catch {}
	}
}

export async function deletePosition(id: string): Promise<void> {
	await db.transaction('rw', db.positions, db.lots, async () => {
		await db.lots.where('positionId').equals(id).delete()
		await db.positions.delete(id)
	})
}

export async function listLots(positionId: string): Promise<Lot[]> {
	return db.lots.where('positionId').equals(positionId).toArray()
}

export async function addLot(input: Lot): Promise<Lot> {
	const l = lotCreateSchema.parse(input)
	await db.lots.add(l)
	// Auto-post: lot added (best-effort)
	try {
		const pos = await db.positions.get(l.positionId)
		if (pos) {
			const pf = await db.portfolios.get(pos.portfolioId)
			if (pf) {
				const post = feedPostCreateSchema.parse({
					id: `fp-lot-${l.id}`,
					userId: pf.userId,
					createdAt: new Date().toISOString(),
					type: 'lot_added',
					symbol: pos.symbol,
					summary: `${l.side === 'buy' ? 'Added' : 'Sold'} ${l.quantity} ${pos.symbol}`,
					dedupeKey: `lot_added:${l.id}`,
				})
				await db.feedPosts.put(post)
			}
		}
	} catch {}
	return l
}

export async function updateLot(id: string, patch: Partial<Lot>): Promise<void> {
	await db.lots.update(id, patch)
}

export async function deleteLot(id: string): Promise<void> {
	await db.lots.delete(id)
}


