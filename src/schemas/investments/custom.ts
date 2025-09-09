import { z } from 'zod'

// Custom lot schema
export const customLotSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  fees: z.number().min(0, 'Fees cannot be negative').optional()
})

// Custom average entry schema
export const customAverageSchema = z.object({
  avgUnitCost: z.number().min(0, 'Average unit cost cannot be negative'),
  totalQuantity: z.number().positive('Total quantity must be positive'),
  totalFees: z.number().min(0, 'Fees cannot be negative').optional()
})

// Price source schema
export const customPriceSourceSchema = z.object({
  type: z.enum(['manual', 'external'], { required_error: 'Price source type is required' }),
  adapter: z.enum(['polygon', 'alpha', 'coingecko', 'custom']).optional(),
  adapterSymbol: z.string().optional(),
  pricePath: z.string().optional()
}).refine((data) => {
  // If external, require adapter and symbol
  if (data.type === 'external') {
    return data.adapter && data.adapterSymbol
  }
  return true
}, {
  message: 'External price source requires adapter and symbol',
  path: ['adapter']
})

// P/L model schema
export const customPLModelSchema = z.object({
  type: z.enum(['standard', 'expression'], { required_error: 'P/L model type is required' }),
  expression: z.string().optional()
}).refine((data) => {
  // If expression type, require expression
  if (data.type === 'expression') {
    return data.expression && data.expression.trim().length > 0
  }
  return true
}, {
  message: 'Expression P/L model requires an expression',
  path: ['expression']
})

// Income schema
export const customIncomeSchema = z.object({
  kind: z.enum(['none', 'apy', 'fixed']).default('none'),
  value: z.number().min(0, 'Income value cannot be negative').optional(),
  reinvest: z.boolean().optional(),
  note: z.string().optional()
})

// Custom definition schema
export const customDefinitionSchema = z.object({
  label: z.string().min(1, 'Instrument label is required'),
  slug: z.string()
    .regex(/^[a-z0-9-]*$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  category: z.string().optional(),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('USD'),
  unitName: z.string().min(1, 'Unit name is required'),
  quantityPrecision: z.number().int().min(0).max(8).default(2),
  multiplier: z.number().positive('Multiplier must be positive').default(1),
  entryMode: z.enum(['lots', 'average'], { required_error: 'Entry mode is required' }),
  priceSource: customPriceSourceSchema,
  plModel: customPLModelSchema
})

// Custom state schema
export const customStateSchema = z.object({
  lots: z.array(customLotSchema).optional(),
  average: customAverageSchema.optional(),
  markPrice: z.number().min(0, 'Mark price cannot be negative').optional(),
  markAsOf: z.string().optional(),
  income: customIncomeSchema.optional(),
  visibility: z.enum(['public', 'friends', 'private'], { required_error: 'Visibility is required' }),
  notes: z.string().optional()
})

// Main custom schema
export const customSchema = z.object({
  instrumentType: z.literal('custom'),
  definition: customDefinitionSchema,
  state: customStateSchema
}).refine((data) => {
  // Ensure lots or average is provided based on entryMode
  if (data.definition.entryMode === 'lots') {
    return data.state.lots && data.state.lots.length > 0
  } else {
    return data.state.average !== undefined
  }
}, {
  message: 'Must provide lots or average based on entry mode',
  path: ['state']
})

export type CustomFormData = z.infer<typeof customSchema>
export type CustomDefinition = z.infer<typeof customDefinitionSchema>
export type CustomState = z.infer<typeof customStateSchema>
export type CustomLot = z.infer<typeof customLotSchema>
export type CustomAverage = z.infer<typeof customAverageSchema>
export type CustomPriceSource = z.infer<typeof customPriceSourceSchema>
export type CustomPLModel = z.infer<typeof customPLModelSchema>
export type CustomIncome = z.infer<typeof customIncomeSchema>
