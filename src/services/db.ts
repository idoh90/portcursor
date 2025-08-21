import Dexie, { type Table } from 'dexie'
import type {
	Portfolio,
	Position,
	Lot,
	Dividend,
	FeedPost,
	Comment,
	Like,
	PrivacySettings,
    PriceQuote,
} from '../models/types'

export type UserRecord = {
	id: string
	displayName: string
	pinHash: string
	createdAt: string
}

export type PortfolioRecord = Portfolio
export type PositionRecord = Position
export type LotRecord = Lot
export type DividendRecord = Dividend
export type FeedPostRecord = FeedPost
export type CommentRecord = Comment
export type LikeRecord = Like
export type PrivacySettingsRecord = PrivacySettings
export type AuditLogRecord = {
	id: string
	userId?: string
	action: string
	details?: any
	ts: string
}
export type PriceQuoteRecord = PriceQuote

class AppDatabase extends Dexie {
	users!: Table<UserRecord, string>
	portfolios!: Table<PortfolioRecord, string>
	positions!: Table<PositionRecord, string>
	lots!: Table<LotRecord, string>
	dividends!: Table<DividendRecord, string>
	feedPosts!: Table<FeedPostRecord, string>
	comments!: Table<CommentRecord, string>
	likes!: Table<LikeRecord, string>
	privacy!: Table<PrivacySettingsRecord, string>
	auditLogs!: Table<AuditLogRecord, string>
    quotes!: Table<PriceQuoteRecord, string>

	constructor() {
		super('portfoliohub')
		// Initial schema
		this.version(1).stores({
			users: 'id, displayName'
		})
		// Expanded domain schema + unique displayName
		this.version(2).stores({
			users: 'id,&displayName',
			portfolios: 'id, userId, visibility',
			positions: 'id, portfolioId, symbol, type, status',
			lots: 'id, positionId, date',
			dividends: 'id, positionId, exDate',
			feedPosts: 'id, userId, createdAt',
			comments: 'id, postId, userId, createdAt',
			likes: 'id, postId, userId, createdAt',
			privacy: 'userId',
		})
		// Social & privacy enhancements: dedupeKey for posts, compound like key, friends visibility
		this.version(3).stores({
			users: 'id,&displayName',
			portfolios: 'id, userId, visibility',
			positions: 'id, portfolioId, symbol, type, status',
			lots: 'id, positionId, date',
			dividends: 'id, positionId, exDate',
			feedPosts: 'id, userId, createdAt, dedupeKey',
			comments: 'id, postId, userId, createdAt',
			likes: 'id, postId, userId, createdAt,&[postId+userId]',
			privacy: 'userId',
		})
		// Audit logs
		this.version(4).stores({
			users: 'id,&displayName',
			portfolios: 'id, userId, visibility',
			positions: 'id, portfolioId, symbol, type, status',
			lots: 'id, positionId, date',
			dividends: 'id, positionId, exDate',
			feedPosts: 'id, userId, createdAt, dedupeKey',
			comments: 'id, postId, userId, createdAt',
			likes: 'id, postId, userId, createdAt,&[postId+userId]',
			privacy: 'userId',
			auditLogs: 'id, ts',
		})
		// Quote cache
		this.version(5).stores({
			users: 'id,&displayName',
			portfolios: 'id, userId, visibility',
			positions: 'id, portfolioId, symbol, type, status',
			lots: 'id, positionId, date',
			dividends: 'id, positionId, exDate',
			feedPosts: 'id, userId, createdAt, dedupeKey',
			comments: 'id, postId, userId, createdAt',
			likes: 'id, postId, userId, createdAt,&[postId+userId]',
			privacy: 'userId',
			auditLogs: 'id, ts',
			quotes: 'symbol, asOf',
		})
	}
}

export const db = new AppDatabase()


