import { describe, it, expect } from 'vitest'
import { customSchema } from '../schemas/investments/custom'
import {
  calculateCustomMetrics,
  evaluateCustomExpression,
  testExpression,
  calculateStandardPL,
  formatQuantity
} from '../helpers/customMath'

describe('Custom Investment Form', () => {
  describe('Custom Schema', () => {
    it('should validate a custom instrument with lots', () => {
      const validCustom = {
        instrumentType: 'custom' as const,
        definition: {
          label: 'Gold Bars',
          slug: 'gold-bars',
          category: 'precious-metals',
          currency: 'USD',
          unitName: 'ounces',
          quantityPrecision: 3,
          multiplier: 1,
          entryMode: 'lots' as const,
          priceSource: { type: 'manual' as const },
          plModel: { type: 'standard' as const }
        },
        state: {
          lots: [
            { date: '2024-01-15', quantity: 10, unitCost: 2000, fees: 50 },
            { date: '2024-02-15', quantity: 5, unitCost: 2100, fees: 25 }
          ],
          markPrice: 2150,
          markAsOf: '2024-03-01',
          visibility: 'public' as const
        }
      }

      const result = customSchema.safeParse(validCustom)
      expect(result.success).toBe(true)
    })

    it('should validate a custom instrument with average entry', () => {
      const validCustom = {
        instrumentType: 'custom' as const,
        definition: {
          label: 'Private Loan',
          category: 'alternative',
          currency: 'USD',
          unitName: 'shares',
          quantityPrecision: 0,
          multiplier: 1,
          entryMode: 'average' as const,
          priceSource: { type: 'manual' as const },
          plModel: { type: 'standard' as const }
        },
        state: {
          average: {
            avgUnitCost: 1000,
            totalQuantity: 100,
            totalFees: 500
          },
          markPrice: 1100,
          visibility: 'private' as const
        }
      }

      const result = customSchema.safeParse(validCustom)
      expect(result.success).toBe(true)
    })

    it('should validate custom expression P/L model', () => {
      const validCustom = {
        instrumentType: 'custom' as const,
        definition: {
          label: 'Wine Collection',
          currency: 'USD',
          unitName: 'bottles',
          entryMode: 'lots' as const,
          priceSource: { type: 'manual' as const },
          plModel: {
            type: 'expression' as const,
            expression: 'quantity * (mark - avgCost) * 1.1 - feesTotal'
          }
        },
        state: {
          lots: [{ date: '2024-01-01', quantity: 12, unitCost: 500 }],
          markPrice: 600,
          visibility: 'friends' as const
        }
      }

      const result = customSchema.safeParse(validCustom)
      expect(result.success).toBe(true)
    })

    it('should validate external price source', () => {
      const validCustom = {
        instrumentType: 'custom' as const,
        definition: {
          label: 'Custom Crypto Token',
          currency: 'USD',
          unitName: 'tokens',
          entryMode: 'average' as const,
          priceSource: {
            type: 'external' as const,
            adapter: 'coingecko' as const,
            adapterSymbol: 'my-token',
            pricePath: '$.current_price'
          },
          plModel: { type: 'standard' as const }
        },
        state: {
          average: { avgUnitCost: 10, totalQuantity: 1000 },
          visibility: 'public' as const
        }
      }

      const result = customSchema.safeParse(validCustom)
      expect(result.success).toBe(true)
    })

    it('should reject invalid slug format', () => {
      const invalidCustom = {
        instrumentType: 'custom' as const,
        definition: {
          label: 'Test Item',
          slug: 'Invalid_Slug!', // Invalid characters
          currency: 'USD',
          unitName: 'units',
          entryMode: 'lots' as const,
          priceSource: { type: 'manual' as const },
          plModel: { type: 'standard' as const }
        },
        state: {
          lots: [{ date: '2024-01-01', quantity: 1, unitCost: 100 }],
          visibility: 'public' as const
        }
      }

      const result = customSchema.safeParse(invalidCustom)
      expect(result.success).toBe(false)
    })

    it('should reject external price source without adapter', () => {
      const invalidCustom = {
        instrumentType: 'custom' as const,
        definition: {
          label: 'Test Item',
          currency: 'USD',
          unitName: 'units',
          entryMode: 'lots' as const,
          priceSource: { type: 'external' as const }, // Missing adapter and symbol
          plModel: { type: 'standard' as const }
        },
        state: {
          lots: [{ date: '2024-01-01', quantity: 1, unitCost: 100 }],
          visibility: 'public' as const
        }
      }

      const result = customSchema.safeParse(invalidCustom)
      expect(result.success).toBe(false)
    })

    it('should reject expression P/L model without expression', () => {
      const invalidCustom = {
        instrumentType: 'custom' as const,
        definition: {
          label: 'Test Item',
          currency: 'USD',
          unitName: 'units',
          entryMode: 'lots' as const,
          priceSource: { type: 'manual' as const },
          plModel: { type: 'expression' as const } // Missing expression
        },
        state: {
          lots: [{ date: '2024-01-01', quantity: 1, unitCost: 100 }],
          visibility: 'public' as const
        }
      }

      const result = customSchema.safeParse(invalidCustom)
      expect(result.success).toBe(false)
    })
  })

  describe('Custom Math Functions', () => {
    it('should calculate standard P/L correctly', () => {
      const pl = calculateStandardPL(
        100,   // quantity
        50,    // avgCost
        55,    // markPrice
        1,     // multiplier
        10     // feesTotal
      )
      
      expect(pl).toBe(490) // (55 - 50) * 100 * 1 - 10 = 500 - 10 = 490
    })

    it('should evaluate custom expressions safely', () => {
      const result = evaluateCustomExpression(
        'quantity * (mark - avgCost) - feesTotal',
        {
          quantity: 100,
          avgCost: 50,
          mark: 55,
          multiplier: 1,
          feesTotal: 10
        }
      )
      
      expect(result.result).toBe(490) // 100 * (55 - 50) - 10 = 490
      expect(result.error).toBeUndefined()
    })

    it('should handle invalid expressions gracefully', () => {
      const result = evaluateCustomExpression(
        'invalid syntax +++',
        {
          quantity: 100,
          avgCost: 50,
          mark: 55,
          multiplier: 1,
          feesTotal: 10
        }
      )
      
      expect(result.result).toBe(0)
      expect(result.error).toBeDefined()
    })

    it('should test expressions with sample data', () => {
      const result = testExpression('quantity * mark - avgCost * quantity')
      
      expect(result.result).toBe(500) // 100 * 55 - 50 * 100 = 5500 - 5000 = 500
      expect(result.error).toBeUndefined()
    })

    it('should calculate custom metrics for lots mode', () => {
      const definition = {
        label: 'Test',
        currency: 'USD',
        unitName: 'units',
        quantityPrecision: 2,
        multiplier: 1,
        entryMode: 'lots' as const,
        priceSource: { type: 'manual' as const },
        plModel: { type: 'standard' as const }
      }

      const state = {
        lots: [
          { date: '2024-01-01', quantity: 50, unitCost: 100, fees: 25 },
          { date: '2024-02-01', quantity: 50, unitCost: 120, fees: 25 }
        ],
        markPrice: 130,
        visibility: 'public' as const
      }

      const metrics = calculateCustomMetrics(definition, state)
      
      expect(metrics.totalQuantity).toBe(100)
      expect(metrics.costBasis).toBe(11050) // (50*100 + 25) + (50*120 + 25) = 5025 + 6025
      expect(metrics.avgCost).toBe(110) // (50*100 + 50*120) / 100
      expect(metrics.notional).toBe(13000) // 100 * 130 * 1
      expect(metrics.unrealizedPL).toBe(1950) // (130 - 110) * 100 - 50
      expect(metrics.feesTotal).toBe(50)
    })

    it('should calculate custom metrics for average mode', () => {
      const definition = {
        label: 'Test',
        currency: 'USD',
        unitName: 'units',
        quantityPrecision: 2,
        multiplier: 2,
        entryMode: 'average' as const,
        priceSource: { type: 'manual' as const },
        plModel: { type: 'standard' as const }
      }

      const state = {
        average: {
          avgUnitCost: 100,
          totalQuantity: 50,
          totalFees: 100
        },
        markPrice: 120,
        visibility: 'public' as const
      }

      const metrics = calculateCustomMetrics(definition, state)
      
      expect(metrics.totalQuantity).toBe(50)
      expect(metrics.costBasis).toBe(5100) // 50 * 100 + 100
      expect(metrics.avgCost).toBe(100)
      expect(metrics.notional).toBe(12000) // 50 * 120 * 2
      expect(metrics.unrealizedPL).toBe(1900) // (120 - 100) * 50 * 2 - 100
    })

    it('should calculate custom metrics with expression P/L model', () => {
      const definition = {
        label: 'Test',
        currency: 'USD',
        unitName: 'units',
        quantityPrecision: 2,
        multiplier: 1,
        entryMode: 'average' as const,
        priceSource: { type: 'manual' as const },
        plModel: {
          type: 'expression' as const,
          expression: 'quantity * mark * 0.9 - quantity * avgCost'
        }
      }

      const state = {
        average: {
          avgUnitCost: 100,
          totalQuantity: 10
        },
        markPrice: 150,
        visibility: 'public' as const
      }

      const metrics = calculateCustomMetrics(definition, state)
      
      expect(metrics.unrealizedPL).toBe(350) // 10 * 150 * 0.9 - 10 * 100 = 1350 - 1000
    })

    it('should format quantity with custom precision', () => {
      expect(formatQuantity(123.456789, 0)).toBe('123')
      expect(formatQuantity(123.456789, 2)).toBe('123.46')
      expect(formatQuantity(123.456789, 4)).toBe('123.4568')
      expect(formatQuantity(123.456789, 8)).toBe('123.45678900')
    })
  })
})
