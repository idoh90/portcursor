import { z } from 'zod'

// Reuse lot and average schemas from stock with same validation rules
export const etfLotSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  shares: z.number().positive('Shares must be positive'),
  price: z.number().positive('Price must be positive'),
  fees: z.number().min(0, 'Fees cannot be negative').optional()
})

export const etfAverageSchema = z.object({
  avgPrice: z.number().positive('Average price must be positive'),
  totalShares: z.number().positive('Total shares must be positive'),
  totalFees: z.number().min(0, 'Fees cannot be negative').optional()
})

// ETF-specific schemas
export const etfDistributionSchema = z.object({
  drip: z.boolean().optional(),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'irregular']).optional()
})

export const etfTargetsSchema = z.object({
  takeProfit: z.number().positive('Take profit price must be positive').optional(),
  stopLoss: z.number().positive('Stop loss price must be positive').optional()
})

// Main ETF schema
export const etfSchema = z.object({
  // Identity
  ticker: z.string()
    .regex(/^[A-Z.\-]{1,10}$/, 'Ticker must be 1-10 uppercase letters, dots, or hyphens')
    .min(1, 'Ticker is required'),
  etfType: z.enum(['equity', 'bond', 'commodity', 'mixed']).optional(),
  expenseRatio: z.number().min(0).max(10, 'Expense ratio must be between 0-10%').optional(),
  
  // Exposure
  side: z.enum(['long', 'short'], { required_error: 'Side is required' }),
  quantity: z.number().positive('Quantity must be positive'),
  
  // Cost/Lots - same as stock
  entryMode: z.enum(['lots', 'average'], { required_error: 'Entry mode is required' }),
  lots: z.array(etfLotSchema).optional(),
  average: etfAverageSchema.optional(),
  
  // Income/Distribution
  distribution: etfDistributionSchema.optional(),
  
  // Targets/Alerts
  targets: etfTargetsSchema.optional(),
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

export type EtfFormData = z.infer<typeof etfSchema>
export type EtfLot = z.infer<typeof etfLotSchema>
export type EtfAverage = z.infer<typeof etfAverageSchema>
export type EtfDistribution = z.infer<typeof etfDistributionSchema>
export type EtfTargets = z.infer<typeof etfTargetsSchema>
