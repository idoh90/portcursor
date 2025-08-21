// Core domain models for PortfolioHub

export type UUID = string

export type Visibility = 'private' | 'public' | 'friends'

export type CurrencyCode = 'USD'

export type InstrumentType = 'stock' | 'option' | 'custom'

export type PositionStatus = 'open' | 'closed'

export type LotSide = 'buy' | 'sell'

export type OptionRight = 'call' | 'put'

export type MarketHoursState = 'open' | 'closed' | 'pre' | 'post' | 'unknown'

export interface User {
	id: UUID
	displayName: string
	createdAt: string
}

export interface PrivacySettings {
	userId: UUID
	portfolioVisibility: Visibility
	profileVisibility?: Visibility
	showPositions: boolean
	showLots: boolean
	showDividends: boolean
	showQuantity?: boolean
	showAvgCost?: boolean
	showRealizedPL?: boolean
	showTodayChange?: boolean
	noIndex?: boolean
	bigMoveThresholdPercent?: number
	// Notification stubs and webhooks
	notifyDailyDigest?: boolean
	notifyAutoPostTypes?: Array<'position_added' | 'position_closed' | 'big_move'>
	webhookDiscordUrl?: string
	webhookTelegramBot?: string
}

export interface Portfolio {
	id: UUID
	userId: UUID
	name: string
	currency: CurrencyCode
	visibility: Visibility
	pinnedSymbols: string[]
	// Cost method for sell realization calculations
	costMethod?: 'FIFO' | 'AVG'
	createdAt: string
	updatedAt: string
}

export interface BasePosition {
	id: UUID
	portfolioId: UUID
	symbol: string
	type: InstrumentType
	status: PositionStatus
	createdAt: string
	updatedAt: string
}

export interface StockPosition extends BasePosition {
	type: 'stock'
}

export interface CustomPosition extends BasePosition {
	type: 'custom'
	label?: string
}

export interface OptionPosition extends BasePosition {
	type: 'option'
	expiration: string
	strike: number
	right: OptionRight
	multiplier: number
}

export type Position = StockPosition | OptionPosition | CustomPosition

export interface Lot {
	id: UUID
	positionId: UUID
	side: LotSide
	quantity: number
	price: number
	fees?: number
	date: string
	// For options, premium is price; multiplier applied at P/L layer
}

export interface Dividend {
	id: UUID
	positionId: UUID
	exDate: string
	payDate?: string
	amountPerShare: number
	currency: CurrencyCode
}

export interface PriceQuote {
	symbol: string
	last: number | null
	prevClose: number | null
	asOf: string
	currency: CurrencyCode
	marketState: MarketHoursState
}

export interface FeedPost {
	id: UUID
	userId: UUID
	createdAt: string
	type: 'position_added' | 'lot_added' | 'position_closed' | 'note'
	symbol?: string
	summary: string
	dedupeKey?: string
}

export interface Comment {
	id: UUID
	postId: UUID
	userId: UUID
	createdAt: string
	text: string
}

export interface Like {
	id: UUID
	postId: UUID
	userId: UUID
	createdAt: string
}

export interface UserPublic {
	userId: UUID
	displayName: string
	slug?: string
	bio?: string
	avatarUrl?: string
	visibility?: Visibility
}


