import { describe, it, expect } from 'vitest'
import { stockSchema, type StockFormData } from '../schemas/investments/stock'

describe('Stock Schema Validation', () => {
  it('should validate a valid stock with lots', () => {
    const validStock: StockFormData = {
      ticker: 'MSFT',
      exchange: 'NASDAQ',
      side: 'long',
      quantity: 100,
      entryMode: 'lots',
      lots: [
        {
          date: '2024-01-15',
          shares: 50,
          price: 150.00,
          fees: 5.99
        },
        {
          date: '2024-02-15',
          shares: 50,
          price: 155.00,
          fees: 5.99
        }
      ],
      drip: true,
      dividendTaxRate: 15,
      targets: {
        takeProfit: 200.00,
        stopLoss: 120.00
      },
      notes: 'Microsoft position',
      visibility: 'public'
    }

    const result = stockSchema.safeParse(validStock)
    expect(result.success).toBe(true)
  })

  it('should validate a valid stock with average entry', () => {
    const validStock: StockFormData = {
      ticker: 'AAPL',
      side: 'long',
      quantity: 100,
      entryMode: 'average',
      average: {
        avgPrice: 175.50,
        totalShares: 100,
        totalFees: 11.98
      },
      visibility: 'private'
    }

    const result = stockSchema.safeParse(validStock)
    expect(result.success).toBe(true)
  })

  it('should reject invalid ticker format', () => {
    const invalidStock = {
      ticker: 'msft123', // Invalid: lowercase and numbers
      side: 'long',
      quantity: 100,
      entryMode: 'lots',
      lots: [{ date: '2024-01-15', shares: 100, price: 150 }],
      visibility: 'public'
    }

    const result = stockSchema.safeParse(invalidStock)
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['ticker'])
  })

  it('should reject negative quantity', () => {
    const invalidStock = {
      ticker: 'MSFT',
      side: 'long',
      quantity: -50, // Invalid: negative
      entryMode: 'lots',
      lots: [{ date: '2024-01-15', shares: 100, price: 150 }],
      visibility: 'public'
    }

    const result = stockSchema.safeParse(invalidStock)
    expect(result.success).toBe(false)
  })

  it('should reject lots mode without lots', () => {
    const invalidStock = {
      ticker: 'MSFT',
      side: 'long',
      quantity: 100,
      entryMode: 'lots',
      // Missing lots array
      visibility: 'public'
    }

    const result = stockSchema.safeParse(invalidStock)
    expect(result.success).toBe(false)
  })

  it('should reject average mode without average data', () => {
    const invalidStock = {
      ticker: 'MSFT',
      side: 'long',
      quantity: 100,
      entryMode: 'average',
      // Missing average object
      visibility: 'public'
    }

    const result = stockSchema.safeParse(invalidStock)
    expect(result.success).toBe(false)
  })

  it('should reject invalid dividend tax rate', () => {
    const invalidStock = {
      ticker: 'MSFT',
      side: 'long',
      quantity: 100,
      entryMode: 'average',
      average: { avgPrice: 150, totalShares: 100 },
      dividendTaxRate: 150, // Invalid: > 100%
      visibility: 'public'
    }

    const result = stockSchema.safeParse(invalidStock)
    expect(result.success).toBe(false)
  })

  it('should accept short positions', () => {
    const shortStock: StockFormData = {
      ticker: 'TSLA',
      side: 'short',
      quantity: 50,
      entryMode: 'average',
      average: {
        avgPrice: 200.00,
        totalShares: 50
      },
      visibility: 'friends'
    }

    const result = stockSchema.safeParse(shortStock)
    expect(result.success).toBe(true)
  })

  it('should validate complex ticker symbols', () => {
    const validTickers = ['BRK.A', 'BRK.B', 'BF-A', 'BF-B']
    
    for (const ticker of validTickers) {
      const stock = {
        ticker,
        side: 'long' as const,
        quantity: 100,
        entryMode: 'average' as const,
        average: { avgPrice: 100, totalShares: 100 },
        visibility: 'public' as const
      }
      
      const result = stockSchema.safeParse(stock)
      expect(result.success).toBe(true)
    }
  })
})
