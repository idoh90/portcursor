import { z } from 'zod'

// Stock lot schema
export const stockLotSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  shares: z.number().positive('Shares must be positive'),
  price: z.number().positive('Price must be positive'),
  fees: z.number().min(0, 'Fees cannot be negative').optional()
})

// Stock average entry schema
export const stockAverageSchema = z.object({
  avgPrice: z.number().positive('Average price must be positive'),
  totalShares: z.number().positive('Total shares must be positive'),
  totalFees: z.number().min(0, 'Fees cannot be negative').optional()
})

// Stock targets schema
export const stockTargetsSchema = z.object({
  takeProfit: z.number().positive('Take profit price must be positive').optional(),
  stopLoss: z.number().positive('Stop loss price must be positive').optional()
})

// Main stock schema
export const stockSchema = z.object({
  // Identity
  ticker: z.string()
    .regex(/^[A-Z.\-]{1,10}$/, 'Ticker must be 1-10 uppercase letters, dots, or hyphens')
    .min(1, 'Ticker is required'),
  exchange: z.string().optional(),
  
  // Exposure
  side: z.enum(['long', 'short'], { required_error: 'Side is required' }),
  quantity: z.number().positive('Quantity must be positive'),
  
  // Cost/Lots
  entryMode: z.enum(['lots', 'average'], { required_error: 'Entry mode is required' }),
  lots: z.array(stockLotSchema).optional(),
  average: stockAverageSchema.optional(),
  
  // Income/Corporate Actions
  drip: z.boolean().optional(),
  dividendTaxRate: z.number().min(0).max(100).optional(),
  
  // Targets/Alerts
  targets: stockTargetsSchema.optional(),
  notes: z.string().optional(),
  
  // Privacy
  visibility: z.enum(['public', 'friends', 'private'], { required_error: 'Visibility is required' })
}).refine((data) => {
  // Ensure lots or average is provided based on entryMode
  if (data.entryMode === 'lots') {
    return data.lots && data.lots.length > 0
  } else {
    return data.average !== undefined
  }
}, {
  message: 'Must provide lots or average based on entry mode',
  path: ['entryMode']
})

export type StockFormData = z.infer<typeof stockSchema>
export type StockLot = z.infer<typeof stockLotSchema>
export type StockAverage = z.infer<typeof stockAverageSchema>
export type StockTargets = z.infer<typeof stockTargetsSchema>