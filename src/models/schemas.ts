import { z } from 'zod'
import type { InstrumentType, LotSide, OptionRight, Visibility } from './types'

const isoDate = () =>
	z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date')

const notFutureDate = () =>
	isoDate().refine((v) => new Date(v).getTime() <= Date.now(), 'Date cannot be in the future')

export const tickerSchema = z
	.string()
	.trim()
	.min(1)
	.max(10)
	.toUpperCase()
	.regex(/^[A-Z][A-Z0-9\.\-]*$/u, 'Invalid ticker')

export const uuidSchema = z.string().min(1)

export const currencySchema = z.enum(['USD'])

export const visibilitySchema: z.ZodType<Visibility> = z.enum(['private', 'public', 'friends'])

export const instrumentTypeSchema: z.ZodType<InstrumentType> = z.enum(['stock', 'option', 'custom'])

export const optionRightSchema: z.ZodType<OptionRight> = z.enum(['call', 'put'])

export const lotSideSchema: z.ZodType<LotSide> = z.enum(['buy', 'sell'])

// User
export const userCreateSchema = z.object({
	id: uuidSchema,
	displayName: z
		.string()
		.trim()
		.min(3)
		.max(20)
		.regex(/^[a-z0-9_]+$/i, 'Display name can contain only letters, numbers, and _'),
	createdAt: isoDate(),
})

// Privacy
export const privacySettingsSchema = z.object({
	userId: uuidSchema,
	portfolioVisibility: visibilitySchema,
	profileVisibility: visibilitySchema.optional(),
	showPositions: z.boolean(),
	showLots: z.boolean(),
	showDividends: z.boolean(),
	showQuantity: z.boolean().optional(),
	showAvgCost: z.boolean().optional(),
	showRealizedPL: z.boolean().optional(),
	showTodayChange: z.boolean().optional(),
	noIndex: z.boolean().optional(),
	bigMoveThresholdPercent: z.number().nonnegative().max(100).optional(),
})

// Portfolio
const portfolioBase = z.object({
	id: uuidSchema,
	userId: uuidSchema,
	name: z.string().trim().min(1).max(60),
	currency: currencySchema,
	visibility: visibilitySchema,
	pinnedSymbols: z.array(tickerSchema).max(5),
	costMethod: z.enum(['FIFO','AVG']).optional(),
	createdAt: isoDate(),
	updatedAt: isoDate(),
})

export const portfolioCreateSchema = portfolioBase.superRefine((val, ctx) => {
	const seen = new Set<string>()
	for (const s of val.pinnedSymbols) {
		if (seen.has(s)) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Pinned symbols must be unique', path: ['pinnedSymbols'] })
			break
		}
		seen.add(s)
	}
})

export const portfolioUpdateSchema = portfolioBase.partial().omit({ id: true, userId: true, createdAt: true })

// Positions
const basePosition = z.object({
	id: uuidSchema,
	portfolioId: uuidSchema,
	symbol: tickerSchema,
	type: instrumentTypeSchema,
	status: z.enum(['open', 'closed']),
	createdAt: isoDate(),
	updatedAt: isoDate(),
})

const stockPosition = basePosition.extend({ type: z.literal('stock') })

const customPosition = basePosition.extend({
	type: z.literal('custom'),
	label: z.string().trim().min(1).max(40).optional(),
})

const optionPosition = basePosition.extend({
	type: z.literal('option'),
	expiration: notFutureDate().or(isoDate()), // allow future expiration
	strike: z.number().positive(),
	right: optionRightSchema,
	multiplier: z.number().positive().default(100),
})

export const positionCreateSchema = z.discriminatedUnion('type', [stockPosition, optionPosition, customPosition])
export const positionUpdateSchema = z.object({
	symbol: tickerSchema.optional(),
	status: z.enum(['open', 'closed']).optional(),
	updatedAt: isoDate().optional(),
	expiration: notFutureDate().or(isoDate()).optional(),
	strike: z.number().positive().optional(),
	right: optionRightSchema.optional(),
	multiplier: z.number().positive().optional(),
	label: z.string().trim().min(1).max(40).optional(),
})

// Lots
export const lotCreateSchema = z.object({
	id: uuidSchema,
	positionId: uuidSchema,
	side: lotSideSchema,
	quantity: z.number().positive(),
	price: z.number().nonnegative(),
	fees: z.number().nonnegative().optional(),
	date: notFutureDate(),
})

export const lotUpdateSchema = lotCreateSchema.partial().omit({ id: true, positionId: true })

// Dividends
export const dividendCreateSchema = z.object({
	id: uuidSchema,
	positionId: uuidSchema,
	exDate: notFutureDate(),
	payDate: isoDate().optional(),
	amountPerShare: z.number().nonnegative(),
	currency: currencySchema,
})

export const dividendUpdateSchema = dividendCreateSchema.partial().omit({ id: true, positionId: true })

// Price quote
export const priceQuoteSchema = z.object({
	symbol: tickerSchema,
	last: z.number().nullable(),
	prevClose: z.number().nullable(),
	asOf: isoDate(),
	currency: currencySchema,
	marketState: z.enum(['open', 'closed', 'pre', 'post', 'unknown']),
})

// Social
export const feedPostCreateSchema = z.object({
	id: uuidSchema,
	userId: uuidSchema,
	createdAt: isoDate(),
	type: z.enum(['position_added', 'lot_added', 'position_closed', 'note']),
	symbol: tickerSchema.optional(),
	summary: z.string().trim().min(1).max(200),
	dedupeKey: z.string().trim().min(1).max(120).optional(),
})

export const commentCreateSchema = z.object({
	id: uuidSchema,
	postId: uuidSchema,
	userId: uuidSchema,
	createdAt: isoDate(),
	text: z.string().trim().min(1).max(280),
})

export const likeCreateSchema = z.object({
	id: uuidSchema,
	postId: uuidSchema,
	userId: uuidSchema,
	createdAt: isoDate(),
})


