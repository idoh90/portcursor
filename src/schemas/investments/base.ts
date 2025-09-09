import { z } from 'zod'

// Common validators
export const isoDateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  'Invalid date format'
)

export const futureDateSchema = z.string().refine(
  (val) => new Date(val) > new Date(),
  'Date must be in the future'
)

export const pastDateSchema = z.string().refine(
  (val) => new Date(val) <= new Date(),
  'Date cannot be in the future'
)

export const tickerSchema = z
  .string()
  .trim()
  .min(1, 'Symbol is required')
  .max(10, 'Symbol too long')
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9\.\-]*$/, 'Invalid symbol format')

export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'JPY', 'BTC', 'ETH'])

export const investmentTypeSchema = z.enum([
  'stock',
  'etf', 
  'option',
  'crypto',
  'bond',
  'commodity',
  'real_estate',
  'cash',
  'custom'
])

// Lot schema
export const lotSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price cannot be negative'),
  fees: z.number().nonnegative().optional(),
  date: pastDateSchema,
  notes: z.string().max(500).optional(),
})

// Privacy schema
export const privacySchema = z.object({
  showPosition: z.boolean().default(true),
  showLots: z.boolean().default(true),
  showPnL: z.boolean().default(true),
})

// Base investment schema
export const baseInvestmentSchema = z.object({
  id: z.string().min(1).optional(),
  symbol: tickerSchema,
  displayName: z.string().max(100).optional(),
  account: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
  notes: z.string().max(1000).optional(),
  privacy: privacySchema.default({
    showPosition: true,
    showLots: true,
    showPnL: true,
  }),
  lots: z.array(lotSchema).default([]),
  createdAt: isoDateSchema.optional(),
  updatedAt: isoDateSchema.optional(),
})

// Common validation functions
export const validateLots = (lots: z.infer<typeof lotSchema>[]) => {
  if (lots.length === 0) {
    throw new Error('At least one lot is required')
  }
  
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0)
  if (totalQuantity <= 0) {
    throw new Error('Total quantity must be positive')
  }
  
  return true
}

export const validateDateRange = (startDate: string, endDate: string) => {
  if (new Date(startDate) >= new Date(endDate)) {
    throw new Error('Start date must be before end date')
  }
  return true
}
