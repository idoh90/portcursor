import { db } from '../db'
import type { Comment, FeedPost, Like } from '../../models/types'
import { commentCreateSchema, feedPostCreateSchema, likeCreateSchema } from '../../models/schemas'

function sanitizeText(input: string): string {
	// Minimal XSS mitigation: strip angle brackets
	return input.replace(/[<>]/g, '')
}

const lastWriteByUser = new Map<string, number>()
const minWriteIntervalMs = 1500

function assertRateLimit(userId: string): void {
	const now = Date.now()
	const last = lastWriteByUser.get(userId) ?? 0
	if (now - last < minWriteIntervalMs) {
		throw new Error('Please wait a moment before posting again')
	}
	lastWriteByUser.set(userId, now)
}

export async function createPost(input: FeedPost): Promise<FeedPost> {
	const p = feedPostCreateSchema.parse(input)
	assertRateLimit(p.userId)
	// Deduplicate by dedupeKey if provided
	if (p.dedupeKey) {
		const existing = await db.feedPosts.where('userId').equals(p.userId).and((x) => x.dedupeKey === p.dedupeKey).first()
		if (existing) return existing
	}
	await db.feedPosts.put(p)
	return p
}

export async function listFeed(limit = 20, cursorCreatedAt?: string, viewerUserId?: string): Promise<{ items: FeedPost[]; nextCursor?: string }> {
	let coll = db.feedPosts.orderBy('createdAt').reverse() as any
	if (cursorCreatedAt) {
		coll = coll.and((p: FeedPost) => p.createdAt < cursorCreatedAt)
	}
	let items: FeedPost[] = await coll.limit(limit).toArray()
	// Privacy enforcement stub: filter out posts from users whose portfolio is private to non-owners
	if (viewerUserId) {
		const allowedUserIds = new Set<string>()
		const uniqueAuthors = Array.from(new Set(items.map((p) => p.userId)))
		await Promise.all(uniqueAuthors.map(async (uid) => {
			const privacy = await db.privacy.get(uid)
			if (!privacy || privacy.portfolioVisibility !== 'private' || uid === viewerUserId) {
				allowedUserIds.add(uid)
			}
		}))
		items = items.filter((p) => allowedUserIds.has(p.userId))
	}
	const nextCursor = items.length === limit ? items[items.length - 1]?.createdAt : undefined
	return { items, nextCursor }
}

export async function listComments(postId: string, limit = 20, cursorCreatedAt?: string): Promise<{ items: Comment[]; nextCursor?: string }> {
	let coll = db.comments.where('postId').equals(postId).orderBy('createdAt') as any
	if (cursorCreatedAt) {
		coll = coll.and((c: Comment) => c.createdAt > cursorCreatedAt)
	}
	const items = await coll.limit(limit).toArray()
	const nextCursor = items.length === limit ? items[items.length - 1]?.createdAt : undefined
	return { items, nextCursor }
}

export async function addComment(input: Comment): Promise<Comment> {
	assertRateLimit(input.userId)
	const now = new Date().toISOString()
	const c = commentCreateSchema.parse({ ...input, text: sanitizeText(input.text), createdAt: now })
	await db.comments.put(c)
	return c
}

export async function deleteComment(id: string): Promise<void> {
	await db.comments.delete(id)
}

export async function toggleLike(postId: string, userId: string): Promise<'liked' | 'unliked'> {
	assertRateLimit(userId)
	const existing = await db.likes.where('[postId+userId]').equals([postId, userId] as any).first()
	if (existing) {
		await db.likes.delete(existing.id)
		return 'unliked'
	}
	const like: Like = likeCreateSchema.parse({ id: `${postId}:${userId}`, postId, userId, createdAt: new Date().toISOString() })
	await db.likes.put(like)
	return 'liked'
}

export async function countLikes(postId: string): Promise<number> {
	return db.likes.where('postId').equals(postId).count()
}


