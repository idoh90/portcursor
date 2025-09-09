import { z } from 'zod'

export type BondFrequency = "zero" | "annual" | "semiannual" | "quarterly" | "monthly"
export type DayCount = "ACT/365" | "ACT/360" | "30/360"

// Bond lot schema
export const bondLotSchema = z.object({
  tradeDate: z.string().min(1, 'Trade date is required'),
  settlementDate: z.string().optional(),
  quantityBonds: z.number().positive('Quantity must be positive'),
  cleanPricePct: z.number().positive('Clean price must be positive'),
  fees: z.number().min(0, 'Fees cannot be negative').optional()
})

// Bond average entry schema
export const bondAverageSchema = z.object({
  avgCleanPricePct: z.number().positive('Average clean price must be positive'),
  totalQuantityBonds: z.number().positive('Total quantity must be positive'),
  totalFees: z.number().min(0, 'Fees cannot be negative').optional()
})

// Bond valuation schema
export const bondValuationSchema = z.object({
  source: z.enum(['live', 'manual']).default('manual'),
  markCleanPricePct: z.number().positive('Mark price must be positive').optional()
})

// Bond tax schema
export const bondTaxSchema = z.object({
  withholdingPct: z.number().min(0).max(100).optional(),
  reinvestCoupons: z.boolean().optional(),
  note: z.string().optional()
})

// Main bond schema
export const bondSchema = z.object({
  // Identity
  instrumentType: z.literal('bond'),
  category: z.enum(['treasury', 'sovereign', 'corporate', 'municipal'], {
    required_error: 'Bond category is required'
  }),
  issuer: z.string().min(1, 'Issuer is required'),
  cusip: z.string().optional(),
  couponRate: z.number().min(0, 'Coupon rate cannot be negative'),
  frequency: z.enum(['zero', 'annual', 'semiannual', 'quarterly', 'monthly'], {
    required_error: 'Coupon frequency is required'
  }),
  dayCount: z.enum(['ACT/365', 'ACT/360', '30/360']).default('ACT/365'),
  maturity: z.string()
    .min(1, 'Maturity date is required')
    .refine(
      (date) => new Date(date) > new Date(),
      'Maturity must be in the future'
    ),
  
  // Position/Lots
  entryMode: z.enum(['lots', 'average'], { required_error: 'Entry mode is required' }),
  lots: z.array(bondLotSchema).optional(),
  average: bondAverageSchema.optional(),
  parPerBond: z.number().positive('Par per bond must be positive').default(1000),
  
  // Valuation
  valuation: bondValuationSchema.optional(),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('USD'),
  
  // Income/Tax
  tax: bondTaxSchema.optional(),
  
  // Privacy
  notes: z.string().optional(),
  visibility: z.enum(['public', 'friends', 'private'], { required_error: 'Visibility is required' })
}).refine((data) => {
  // Zero coupon bonds must have 0% coupon rate
  if (data.frequency === 'zero') {
    return data.couponRate === 0
  }
  return true
}, {
  message: 'Zero coupon bonds must have 0% coupon rate',
  path: ['couponRate']
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

export type BondFormData = z.infer<typeof bondSchema>
export type BondLot = z.infer<typeof bondLotSchema>
export type BondAverage = z.infer<typeof bondAverageSchema>
export type BondValuation = z.infer<typeof bondValuationSchema>
export type BondTax = z.infer<typeof bondTaxSchema>