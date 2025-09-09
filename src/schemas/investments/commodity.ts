import { z } from 'zod'

// Commodity targets schema
export const commodityTargetsSchema = z.object({
  targetPrice: z.number().positive('Target price must be positive').optional(),
  stopPrice: z.number().positive('Stop price must be positive').optional()
})

// Main commodity schema
export const commoditySchema = z.object({
  // Identity
  instrumentType: z.literal('commodity'),
  mode: z.enum(['spot', 'futures'], { required_error: 'Commodity mode is required' }),
  symbol: z.string().min(1, 'Commodity symbol is required'),
  venue: z.string().optional(),
  
  // Common fields
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('USD'),
  entryDate: z.string().min(1, 'Entry date is required'),
  fees: z.number().min(0, 'Fees cannot be negative').optional(),
  
  // Spot fields
  units: z.number().positive('Units must be positive').optional(),
  unitType: z.string().min(1, 'Unit type is required').optional(),
  entryPricePerUnit: z.number().positive('Entry price per unit must be positive').optional(),
  
  // Futures fields
  contractCode: z.string().optional(),
  contractMonth: z.string().length(1, 'Contract month must be single letter').optional(),
  contractYear: z.number().int().min(2020).max(2050).optional(),
  contracts: z.number().positive('Number of contracts must be positive').optional(),
  multiplier: z.number().positive('Contract multiplier must be positive').optional(),
  tickSize: z.number().positive('Tick size must be positive').optional(),
  tickValue: z.number().positive('Tick value must be positive').optional(),
  entryPricePerUnitFut: z.number().positive('Entry price per unit must be positive').optional(),
  
  // Risk management
  targets: commodityTargetsSchema.optional(),
  marginPosted: z.number().min(0, 'Margin posted cannot be negative').optional(),
  notes: z.string().optional(),
  
  // Privacy
  visibility: z.enum(['public', 'friends', 'private'], { required_error: 'Visibility is required' })
}).refine((data) => {
  // Validate spot mode fields
  if (data.mode === 'spot') {
    return data.units && data.unitType && data.entryPricePerUnit
  }
  return true
}, {
  message: 'Spot commodities require units, unit type, and entry price per unit',
  path: ['mode']
}).refine((data) => {
  // Validate futures mode fields
  if (data.mode === 'futures') {
    return data.contractCode && data.contractMonth && data.contractYear && 
           data.contracts && data.multiplier && data.entryPricePerUnitFut
  }
  return true
}, {
  message: 'Futures require contract code, month, year, contracts, multiplier, and entry price',
  path: ['mode']
})

export type CommodityFormData = z.infer<typeof commoditySchema>
export type CommodityTargets = z.infer<typeof commodityTargetsSchema>
