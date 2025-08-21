import { db } from '../db'

export async function exportUserDataJson(userId: string): Promise<Blob> {
	const [user, portfolios, positions, lots, dividends, posts, comments, likes, privacy] = await Promise.all([
		db.users.get(userId),
		db.portfolios.where('userId').equals(userId).toArray(),
		db.positions.toArray().then((xs) => xs.filter((x) => portfolios.some((p) => p.id === x.portfolioId))),
		db.lots.toArray().then((xs) => xs.filter((x) => positions.some((p) => p.id === x.positionId))),
		db.dividends.toArray().then((xs) => xs.filter((x) => positions.some((p) => p.id === x.positionId))),
		db.feedPosts.where('userId').equals(userId).toArray(),
		db.comments.where('userId').equals(userId).toArray(),
		db.likes.where('userId').equals(userId).toArray(),
		db.privacy.get(userId),
	])
	const data = { user, portfolios, positions, lots, dividends, posts, comments, likes, privacy }
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
	return blob
}

function toCsv(rows: Array<Record<string, unknown>>): string {
	if (rows.length === 0) return ''
	const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
	const escape = (v: unknown) => {
		if (v == null) return ''
		const s = String(v)
		return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
	}
	const lines = [headers.join(',')]
	for (const r of rows) {
		lines.push(headers.map((h) => escape((r as any)[h])).join(','))
	}
	return lines.join('\n')
}

export async function exportUserDataCsv(userId: string): Promise<Map<string, Blob>> {
	const files = new Map<string, Blob>()
	const [portfolios, positions, lots, dividends, posts, comments, likes] = await Promise.all([
		db.portfolios.where('userId').equals(userId).toArray(),
		db.positions.toArray(),
		db.lots.toArray(),
		db.dividends.toArray(),
		db.feedPosts.where('userId').equals(userId).toArray(),
		db.comments.where('userId').equals(userId).toArray(),
		db.likes.where('userId').equals(userId).toArray(),
	])
	files.set('portfolios.csv', new Blob([toCsv(portfolios as any)], { type: 'text/csv' }))
	files.set('positions.csv', new Blob([toCsv(positions.filter((x) => portfolios.some((p) => p.id === x.portfolioId)) as any)], { type: 'text/csv' }))
	files.set('lots.csv', new Blob([toCsv(lots.filter((x) => positions.some((p) => p.id === x.positionId)) as any)], { type: 'text/csv' }))
	files.set('dividends.csv', new Blob([toCsv(dividends.filter((x) => positions.some((p) => p.id === x.positionId)) as any)], { type: 'text/csv' }))
	files.set('feedPosts.csv', new Blob([toCsv(posts as any)], { type: 'text/csv' }))
	files.set('comments.csv', new Blob([toCsv(comments as any)], { type: 'text/csv' }))
	files.set('likes.csv', new Blob([toCsv(likes as any)], { type: 'text/csv' }))
	return files
}

export async function softDeleteUser(userId: string): Promise<void> {
	// Make profile private and delete social artifacts
	await db.transaction('rw', db.privacy, db.feedPosts, db.comments, db.likes, async () => {
		const existing = await db.privacy.get(userId)
		await db.privacy.put({
			userId,
			portfolioVisibility: 'private',
			profileVisibility: 'private',
			showPositions: false,
			showLots: false,
			showDividends: false,
			noIndex: true,
		})
		await db.feedPosts.where('userId').equals(userId).delete()
		await db.comments.where('userId').equals(userId).delete()
		await db.likes.where('userId').equals(userId).delete()
	})
}

export async function hardDeleteUser(userId: string): Promise<void> {
	await db.transaction('rw', db.users, db.portfolios, db.positions, db.lots, db.dividends, db.feedPosts, db.comments, db.likes, db.privacy, async () => {
		const portfolios = await db.portfolios.where('userId').equals(userId).toArray()
		for (const pf of portfolios) {
			const pos = await db.positions.where('portfolioId').equals(pf.id).toArray()
			for (const p of pos) {
				await db.lots.where('positionId').equals(p.id).delete()
				await db.dividends.where('positionId').equals(p.id).delete()
			}
			await db.positions.where('portfolioId').equals(pf.id).delete()
		}
		await db.portfolios.where('userId').equals(userId).delete()
		await db.feedPosts.where('userId').equals(userId).delete()
		await db.comments.where('userId').equals(userId).delete()
		await db.likes.where('userId').equals(userId).delete()
		await db.privacy.delete(userId)
		await db.users.delete(userId)
	})
}


