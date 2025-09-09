import { z } from 'zod'

// Real estate location schema
export const realEstateLocationSchema = z.object({
  country: z.string().optional(),
  city: z.string().optional()
})

// Real estate acquisition schema
export const realEstateAcquisitionSchema = z.object({
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  purchasePrice: z.number().positive('Purchase price must be positive'),
  closingCosts: z.number().min(0, 'Closing costs cannot be negative').optional(),
  improvementsToDate: z.number().min(0, 'Improvements cannot be negative').optional()
})

// Real estate financing schema
export const realEstateFinancingSchema = z.object({
  hasMortgage: z.boolean(),
  principal: z.number().positive('Principal must be positive').optional(),
  interestRatePct: z.number().min(0, 'Interest rate cannot be negative').optional(),
  termMonths: z.number().int().positive('Term must be positive').optional(),
  monthlyPayment: z.number().positive('Monthly payment must be positive').optional()
}).refine((data) => {
  // If has mortgage, require principal and interest rate
  if (data.hasMortgage) {
    return data.principal && data.interestRatePct !== undefined
  }
  return true
}, {
  message: 'Mortgage requires principal and interest rate',
  path: ['principal']
})

// Real estate income schema
export const realEstateIncomeSchema = z.object({
  monthlyRent: z.number().min(0, 'Monthly rent cannot be negative').optional(),
  otherMonthlyIncome: z.number().min(0, 'Other income cannot be negative').optional()
})

// Real estate expenses schema
export const realEstateExpensesSchema = z.object({
  maintenance: z.number().min(0, 'Maintenance cannot be negative').optional(),
  taxes: z.number().min(0, 'Taxes cannot be negative').optional(),
  insurance: z.number().min(0, 'Insurance cannot be negative').optional(),
  management: z.number().min(0, 'Management cannot be negative').optional()
})

// Real estate valuation schema
export const realEstateValuationSchema = z.object({
  currentValue: z.number().positive('Current value must be positive'),
  valuationDate: z.string().min(1, 'Valuation date is required')
})

// Main real estate schema
export const realEstateSchema = z.object({
  // Identity
  instrumentType: z.literal('real_estate'),
  label: z.string().min(1, 'Property label is required'),
  propertyType: z.enum(['residential', 'commercial', 'land', 'mixed'], {
    required_error: 'Property type is required'
  }),
  location: realEstateLocationSchema.optional(),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('USD'),
  
  // Acquisition
  acquisition: realEstateAcquisitionSchema,
  
  // Financing
  financing: realEstateFinancingSchema.optional(),
  
  // Income & Expenses
  income: realEstateIncomeSchema.optional(),
  expenses: realEstateExpensesSchema.optional(),
  
  // Valuation
  valuation: realEstateValuationSchema,
  
  // Privacy
  notes: z.string().optional(),
  visibility: z.enum(['public', 'friends', 'private'], { required_error: 'Visibility is required' })
})

export type RealEstateFormData = z.infer<typeof realEstateSchema>
export type RealEstateLocation = z.infer<typeof realEstateLocationSchema>
export type RealEstateAcquisition = z.infer<typeof realEstateAcquisitionSchema>
export type RealEstateFinancing = z.infer<typeof realEstateFinancingSchema>
export type RealEstateIncome = z.infer<typeof realEstateIncomeSchema>
export type RealEstateExpenses = z.infer<typeof realEstateExpensesSchema>
export type RealEstateValuation = z.infer<typeof realEstateValuationSchema>