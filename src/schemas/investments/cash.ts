import { z } from 'zod'

// Main cash schema
export const cashSchema = z.object({
  // Identity
  instrumentType: z.literal('cash'),
  label: z.string().min(1, 'Account label is required'),
  institution: z.string().optional(),
  currency: z.string()
    .length(3, 'Currency must be 3-letter ISO code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters'),
  
  // Balance & Yield
  amount: z.number().min(0, 'Amount cannot be negative'),
  apyPct: z.number().min(0, 'APY cannot be negative').optional(),
  compounding: z.enum(['daily', 'monthly', 'quarterly', 'none']).default('monthly'),
  autoAccrue: z.boolean().default(false),
  
  // Privacy
  notes: z.string().optional(),
  visibility: z.enum(['public', 'friends', 'private'], { required_error: 'Visibility is required' })
})

export type CashFormData = z.infer<typeof cashSchema>
