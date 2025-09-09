// Export all investment schemas
export * from './base'
export * from './stock'
export * from './option'
export * from './crypto'
export * from './bond'
export * from './realEstate'

import { z } from 'zod'
import { stockInvestmentSchema } from './stock'
import { optionInvestmentSchema } from './option'
import { cryptoInvestmentSchema } from './crypto'
import { bondInvestmentSchema } from './bond'
import { realEstateInvestmentSchema } from './realEstate'
import { baseInvestmentSchema } from './base'

// ETF schema (similar to stock)
export const etfInvestmentSchema = baseInvestmentSchema.extend({
  type: z.literal('etf'),
  dividendReinvestment: z.boolean().default(false),
  expenseRatio: z.number().nonnegative().max(10).optional(), // Expense ratio as percentage
  category: z.string().max(50).optional(), // e.g., "Large Cap Growth"
})

// Commodity schema
export const commodityInvestmentSchema = baseInvestmentSchema.extend({
  type: z.literal('commodity'),
  commodityType: z.string().max(50), // e.g., "Gold", "Oil", "Wheat"
  unit: z.string().max(20), // e.g., "oz", "barrel", "bushel"
  storageLocation: z.string().max(100).optional(),
  storageFees: z.number().nonnegative().optional(),
  purity: z.number().min(0).max(100).optional(), // For precious metals
})

// Cash schema
export const cashInvestmentSchema = baseInvestmentSchema.extend({
  type: z.literal('cash'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY']),
  interestRate: z.number().nonnegative().max(50).optional(), // APY as percentage
  institution: z.string().max(100).optional(),
  accountType: z.enum(['savings', 'checking', 'cd', 'money-market', 'other']).optional(),
  maturityDate: z.string().optional(), // For CDs
})

// Custom schema
export const customInvestmentSchema = baseInvestmentSchema.extend({
  type: z.literal('custom'),
  category: z.string().max(50),
  valueModel: z.enum(['manual', 'lot_based']),
  customFields: z.record(z.string(), z.any()).optional(),
  manualValue: z.number().nonnegative().optional(),
})

// Union of all investment types
export const investmentSchema = z.discriminatedUnion('type', [
  stockInvestmentSchema,
  etfInvestmentSchema,
  optionInvestmentSchema,
  cryptoInvestmentSchema,
  bondInvestmentSchema,
  commodityInvestmentSchema,
  realEstateInvestmentSchema,
  cashInvestmentSchema,
  customInvestmentSchema,
])

// Form schemas for each type
export const etfFormSchema = z.object({
  symbol: baseInvestmentSchema.shape.symbol,
  displayName: baseInvestmentSchema.shape.displayName,
  category: z.string().max(50).optional(),
  expenseRatio: z.number().nonnegative().max(10).optional(),
  dividendReinvestment: z.boolean().default(false),
  
  // Entry method
  entryMethod: z.enum(['single', 'multiple', 'average']).default('single'),
  
  // Single lot entry
  quantity: z.number().positive().optional(),
  price: z.number().nonnegative().optional(),
  fees: z.number().nonnegative().optional(),
  date: baseInvestmentSchema.shape.lots.element.shape.date.optional(),
  
  // Average cost entry
  totalQuantity: z.number().positive().optional(),
  averageCost: z.number().nonnegative().optional(),
  totalFees: z.number().nonnegative().optional(),
  
  lots: baseInvestmentSchema.shape.lots.optional(),
  account: baseInvestmentSchema.shape.account,
  tags: baseInvestmentSchema.shape.tags,
  notes: baseInvestmentSchema.shape.notes,
  privacy: baseInvestmentSchema.shape.privacy,
})

export const commodityFormSchema = z.object({
  symbol: z.string().max(20).optional(),
  displayName: baseInvestmentSchema.shape.displayName,
  commodityType: z.string().min(1, 'Commodity type is required').max(50),
  unit: z.string().min(1, 'Unit is required').max(20),
  
  // Purchase details
  quantity: z.number().positive('Quantity must be positive'),
  price: z.number().nonnegative('Price cannot be negative'),
  fees: z.number().nonnegative().default(0),
  date: baseInvestmentSchema.shape.lots.element.shape.date,
  
  // Storage
  storageLocation: z.string().max(100).optional(),
  storageFees: z.number().nonnegative().optional(),
  purity: z.number().min(0).max(100).optional(),
  
  account: baseInvestmentSchema.shape.account,
  tags: baseInvestmentSchema.shape.tags,
  notes: baseInvestmentSchema.shape.notes,
  privacy: baseInvestmentSchema.shape.privacy,
})

export const cashFormSchema = z.object({
  displayName: z.string().min(1, 'Account name is required').max(100),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY']),
  balance: z.number().nonnegative('Balance cannot be negative'),
  interestRate: z.number().nonnegative().max(50).optional(),
  institution: z.string().max(100).optional(),
  accountType: z.enum(['savings', 'checking', 'cd', 'money-market', 'other']).optional(),
  maturityDate: z.string().optional(),
  
  account: baseInvestmentSchema.shape.account,
  tags: baseInvestmentSchema.shape.tags,
  notes: baseInvestmentSchema.shape.notes,
  privacy: baseInvestmentSchema.shape.privacy,
})

export const customFormSchema = z.object({
  symbol: z.string().max(20).optional(),
  displayName: z.string().min(1, 'Name is required').max(100),
  category: z.string().min(1, 'Category is required').max(50),
  valueModel: z.enum(['manual', 'lot_based']),
  
  // Manual value
  manualValue: z.number().nonnegative().optional(),
  
  // Lot-based value
  quantity: z.number().positive().optional(),
  price: z.number().nonnegative().optional(),
  fees: z.number().nonnegative().optional(),
  date: baseInvestmentSchema.shape.lots.element.shape.date.optional(),
  
  // Custom fields
  customFields: z.record(z.string(), z.any()).optional(),
  
  account: baseInvestmentSchema.shape.account,
  tags: baseInvestmentSchema.shape.tags,
  notes: baseInvestmentSchema.shape.notes,
  privacy: baseInvestmentSchema.shape.privacy,
}).refine((data) => {
  if (data.valueModel === 'manual') {
    return data.manualValue !== undefined
  }
  if (data.valueModel === 'lot_based') {
    return data.quantity && data.price && data.date
  }
  return false
}, {
  message: 'Required fields missing for selected value model',
})

// CSV import schemas
export const csvImportMappingSchema = z.object({
  symbol: z.string().min(1, 'Symbol column is required'),
  quantity: z.string().min(1, 'Quantity column is required'),
  price: z.string().min(1, 'Price column is required'),
  date: z.string().min(1, 'Date column is required'),
  fees: z.string().optional(),
  notes: z.string().optional(),
  account: z.string().optional(),
  tags: z.string().optional(),
})

export const csvImportPreviewSchema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  mapping: csvImportMappingSchema,
  investmentType: z.enum(['stock', 'etf', 'crypto', 'commodity']),
})

// Export types
export type Investment = z.infer<typeof investmentSchema>
export type ETFInvestment = z.infer<typeof etfInvestmentSchema>
export type CommodityInvestment = z.infer<typeof commodityInvestmentSchema>
export type CashInvestment = z.infer<typeof cashInvestmentSchema>
export type CustomInvestment = z.infer<typeof customInvestmentSchema>

export type ETFFormData = z.infer<typeof etfFormSchema>
export type CommodityFormData = z.infer<typeof commodityFormSchema>
export type CashFormData = z.infer<typeof cashFormSchema>
export type CustomFormData = z.infer<typeof customFormSchema>

export type CsvImportMapping = z.infer<typeof csvImportMappingSchema>
export type CsvImportPreview = z.infer<typeof csvImportPreviewSchema>
