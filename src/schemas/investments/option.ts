import { z } from 'zod'

// Option-specific schemas
export const optionTargetsSchema = z.object({
  targetPremium: z.number().positive('Target premium must be positive').optional(),
  maxLossGuard: z.boolean().optional(),
  collateral: z.number().positive('Collateral must be positive').optional()
})

// Main option schema
export const optionSchema = z.object({
  // Contract Identity
  underlying: z.string()
    .regex(/^[A-Z.\-]{1,10}$/, 'Underlying must be 1-10 uppercase letters, dots, or hyphens')
    .min(1, 'Underlying ticker is required'),
  kind: z.enum(['call', 'put'], { required_error: 'Option type is required' }),
  expiration: z.string()
    .min(1, 'Expiration date is required')
    .refine(
      (date) => new Date(date) > new Date(),
      'Expiration must be in the future'
    ),
  strike: z.number().positive('Strike price must be positive'),
  style: z.enum(['american', 'european']).optional(),
  multiplier: z.number().positive('Multiplier must be positive').default(100),
  
  // Exposure
  side: z.enum(['long', 'short'], { required_error: 'Position side is required' }),
  contracts: z.number().positive('Number of contracts must be positive'),
  
  // Cost/Premium
  premium: z.number().min(0, 'Premium cannot be negative'),
  fees: z.number().min(0, 'Fees cannot be negative').optional(),
  entryDate: z.string().min(1, 'Entry date is required'),
  
  // Advanced (optional)
  assignment: z.object({
    isAssigned: z.boolean().optional(),
    assignmentDate: z.string().optional(),
    assignmentPrice: z.number().optional()
  }).optional(),
  
  // Greeks (optional, for display/notes only)
  greeks: z.object({
    delta: z.number().optional(),
    gamma: z.number().optional(),
    theta: z.number().optional(),
    impliedVolatility: z.number().optional()
  }).optional(),
  
  // Targets/Alerts
  targets: optionTargetsSchema.optional(),
  notes: z.string().optional(),
  
  // Privacy
  visibility: z.enum(['public', 'friends', 'private'], { required_error: 'Visibility is required' })
})

export type OptionFormData = z.infer<typeof optionSchema>
export type OptionTargets = z.infer<typeof optionTargetsSchema>

// Helper functions for option calculations
export function calculateDaysToExpiry(expiration: string): number {
  const expiryDate = new Date(expiration)
  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function calculateBreakeven(
  kind: 'call' | 'put',
  strike: number,
  premium: number
): number {
  if (kind === 'call') {
    return strike + premium
  } else {
    return strike - premium
  }
}

export function calculateNotionalValue(
  contracts: number,
  multiplier: number,
  underlyingPrice: number
): number {
  return contracts * multiplier * underlyingPrice
}

export function calculateCostBasis(
  contracts: number,
  multiplier: number,
  premium: number,
  fees: number = 0
): number {
  return contracts * multiplier * premium + fees
}