import { describe, it, expect } from 'vitest'
import { stockSchema } from '../schemas/investments/stock'
import { etfSchema } from '../schemas/investments/etf'
import { optionSchema } from '../schemas/investments/option'
import { cryptoSchema } from '../schemas/investments/crypto'

describe('Investment Form Schemas', () => {
  describe('Stock Schema', () => {
    it('should validate a complete stock position', () => {
      const validStock = {
        ticker: 'MSFT',
        exchange: 'NASDAQ',
        side: 'long' as const,
        quantity: 100,
        entryMode: 'lots' as const,
        lots: [{ date: '2024-01-15', shares: 100, price: 150.00, fees: 5.99 }],
        drip: true,
        dividendTaxRate: 15,
        targets: { takeProfit: 200, stopLoss: 120 },
        notes: 'Microsoft position',
        visibility: 'public' as const
      }

      const result = stockSchema.safeParse(validStock)
      expect(result.success).toBe(true)
    })

    it('should reject invalid ticker format', () => {
      const invalidStock = {
        ticker: 'msft123',
        side: 'long' as const,
        quantity: 100,
        entryMode: 'lots' as const,
        lots: [{ date: '2024-01-15', shares: 100, price: 150 }],
        visibility: 'public' as const
      }

      const result = stockSchema.safeParse(invalidStock)
      expect(result.success).toBe(false)
    })
  })

  describe('ETF Schema', () => {
    it('should validate a complete ETF position', () => {
      const validEtf = {
        ticker: 'VOO',
        etfType: 'equity' as const,
        expenseRatio: 0.03,
        side: 'long' as const,
        quantity: 50,
        entryMode: 'average' as const,
        average: { avgPrice: 400, totalShares: 50, totalFees: 0 },
        distribution: { drip: true, frequency: 'quarterly' as const },
        visibility: 'public' as const
      }

      const result = etfSchema.safeParse(validEtf)
      expect(result.success).toBe(true)
    })

    it('should reject invalid expense ratio', () => {
      const invalidEtf = {
        ticker: 'VOO',
        expenseRatio: 15, // Too high
        side: 'long' as const,
        quantity: 50,
        entryMode: 'average' as const,
        average: { avgPrice: 400, totalShares: 50 },
        visibility: 'public' as const
      }

      const result = etfSchema.safeParse(invalidEtf)
      expect(result.success).toBe(false)
    })
  })

  describe('Option Schema', () => {
    it('should validate a complete option position', () => {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 2)
      
      const validOption = {
        underlying: 'AAPL',
        kind: 'call' as const,
        expiration: futureDate.toISOString().split('T')[0],
        strike: 150,
        style: 'american' as const,
        multiplier: 100,
        side: 'long' as const,
        contracts: 2,
        premium: 5.50,
        fees: 2.00,
        entryDate: '2024-01-15',
        greeks: { delta: 0.6, gamma: 0.05, theta: -0.1, impliedVolatility: 25 },
        targets: { targetPremium: 8.00, maxLossGuard: true, collateral: 30000 },
        visibility: 'private' as const
      }

      const result = optionSchema.safeParse(validOption)
      expect(result.success).toBe(true)
    })

    it('should reject past expiration date', () => {
      const pastDate = new Date()
      pastDate.setMonth(pastDate.getMonth() - 1)
      
      const invalidOption = {
        underlying: 'AAPL',
        kind: 'call' as const,
        expiration: pastDate.toISOString().split('T')[0], // Past date
        strike: 150,
        side: 'long' as const,
        contracts: 1,
        premium: 5.50,
        entryDate: '2024-01-15',
        visibility: 'public' as const
      }

      const result = optionSchema.safeParse(invalidOption)
      expect(result.success).toBe(false)
    })
  })

  describe('Crypto Schema', () => {
    it('should validate a complete crypto position', () => {
      const validCrypto = {
        asset: 'BTC',
        network: 'Bitcoin',
        custody: 'wallet' as const,
        label: 'Hardware Wallet',
        side: 'long' as const,
        quantity: 1.5,
        entryMode: 'lots' as const,
        lots: [
          { date: '2024-01-15', amount: 0.5, priceUSD: 45000, feesUSD: 10 },
          { date: '2024-02-15', amount: 1.0, priceUSD: 50000, feesUSD: 15 }
        ],
        staking: { enabled: false },
        targets: { takeProfitUSD: 100000, stopLossUSD: 30000 },
        visibility: 'friends' as const
      }

      const result = cryptoSchema.safeParse(validCrypto)
      expect(result.success).toBe(true)
    })

    it('should validate staking configuration', () => {
      const stakingCrypto = {
        asset: 'ETH',
        side: 'long' as const,
        quantity: 32,
        entryMode: 'average' as const,
        average: { avgCostUSD: 2000, totalAmount: 32, totalFeesUSD: 50 },
        staking: { enabled: true, apy: 5.5, note: 'Ethereum 2.0 staking' },
        visibility: 'public' as const
      }

      const result = cryptoSchema.safeParse(stakingCrypto)
      expect(result.success).toBe(true)
    })

    it('should reject invalid asset symbol', () => {
      const invalidCrypto = {
        asset: 'bitcoin', // Should be uppercase
        side: 'long' as const,
        quantity: 1,
        entryMode: 'average' as const,
        average: { avgCostUSD: 50000, totalAmount: 1 },
        visibility: 'public' as const
      }

      const result = cryptoSchema.safeParse(invalidCrypto)
      expect(result.success).toBe(false)
    })

    it('should validate 8 decimal place precision', () => {
      const preciseCrypto = {
        asset: 'BTC',
        side: 'long' as const,
        quantity: 0.12345678, // 8 decimal places - valid
        entryMode: 'average' as const,
        average: { avgCostUSD: 50000, totalAmount: 0.12345678 },
        visibility: 'public' as const
      }

      const result = cryptoSchema.safeParse(preciseCrypto)
      expect(result.success).toBe(true)
    })
  })
})
