import { z } from 'zod'

// Crypto lot schema for transaction tracking
export const cryptoLotSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  amount: z.number().positive('Amount must be positive'),
  priceUSD: z.number().positive('Price USD must be positive'),
  feesUSD: z.number().min(0, 'Fees cannot be negative').optional()
})

// Crypto average entry schema
export const cryptoAverageSchema = z.object({
  avgCostUSD: z.number().positive('Average cost USD must be positive'),
  totalAmount: z.number().positive('Total amount must be positive'),
  totalFeesUSD: z.number().min(0, 'Fees cannot be negative').optional()
})

// Staking configuration schema
export const cryptoStakingSchema = z.object({
  enabled: z.boolean().optional(),
  apy: z.number().min(0).max(1000, 'APY must be between 0-1000%').optional(),
  note: z.string().optional()
})

// Crypto targets schema
export const cryptoTargetsSchema = z.object({
  takeProfitUSD: z.number().positive('Take profit price must be positive').optional(),
  stopLossUSD: z.number().positive('Stop loss price must be positive').optional()
})

// Main crypto schema
export const cryptoSchema = z.object({
  // Identity
  asset: z.string()
    .regex(/^[A-Z0-9]{1,10}$/, 'Asset symbol must be 1-10 uppercase letters or numbers')
    .min(1, 'Asset symbol is required'),
  network: z.string().optional(),
  custody: z.enum(['exchange', 'wallet']).optional(),
  label: z.string().optional(),
  
  // Exposure
  side: z.enum(['long', 'short']).default('long'),
  quantity: z.number().positive('Quantity must be positive'),
  
  // Cost/Lots
  entryMode: z.enum(['lots', 'average'], { required_error: 'Entry mode is required' }),
  lots: z.array(cryptoLotSchema).optional(),
  average: cryptoAverageSchema.optional(),
  
  // Yield/Staking
  staking: cryptoStakingSchema.optional(),
  
  // Targets/Alerts
  targets: cryptoTargetsSchema.optional(),
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
}).refine((data) => {
  // Validate coin precision (up to 8 decimal places)
  if (data.lots) {
    return data.lots.every(lot => {
      const decimals = lot.amount.toString().split('.')[1]
      return !decimals || decimals.length <= 8
    })
  }
  if (data.average) {
    const decimals = data.average.totalAmount.toString().split('.')[1]
    return !decimals || decimals.length <= 8
  }
  return true
}, {
  message: 'Crypto amounts can have maximum 8 decimal places',
  path: ['quantity']
})

export type CryptoFormData = z.infer<typeof cryptoSchema>
export type CryptoLot = z.infer<typeof cryptoLotSchema>
export type CryptoAverage = z.infer<typeof cryptoAverageSchema>
export type CryptoStaking = z.infer<typeof cryptoStakingSchema>
export type CryptoTargets = z.infer<typeof cryptoTargetsSchema>

// Helper functions for crypto calculations
export function calculateCostBasisUSD(
  entryMode: 'lots' | 'average',
  lots?: CryptoLot[],
  average?: CryptoAverage
): number {
  if (entryMode === 'lots' && lots) {
    return lots.reduce((sum, lot) => {
      return sum + (lot.amount * lot.priceUSD) + (lot.feesUSD || 0)
    }, 0)
  } else if (entryMode === 'average' && average) {
    return (average.totalAmount * average.avgCostUSD) + (average.totalFeesUSD || 0)
  }
  return 0
}

export function calculateAverageCostUSD(
  entryMode: 'lots' | 'average',
  lots?: CryptoLot[],
  average?: CryptoAverage
): number {
  if (entryMode === 'lots' && lots && lots.length > 0) {
    const totalAmount = lots.reduce((sum, lot) => sum + lot.amount, 0)
    const totalCost = lots.reduce((sum, lot) => sum + (lot.amount * lot.priceUSD), 0)
    return totalAmount > 0 ? totalCost / totalAmount : 0
  } else if (entryMode === 'average' && average) {
    return average.avgCostUSD
  }
  return 0
}

export function calculateTotalAmount(
  entryMode: 'lots' | 'average',
  lots?: CryptoLot[],
  average?: CryptoAverage
): number {
  if (entryMode === 'lots' && lots) {
    return lots.reduce((sum, lot) => sum + lot.amount, 0)
  } else if (entryMode === 'average' && average) {
    return average.totalAmount
  }
  return 0
}