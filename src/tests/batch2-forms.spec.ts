import { describe, it, expect } from 'vitest'
import { bondSchema } from '../schemas/investments/bond'
import { commoditySchema } from '../schemas/investments/commodity'
import { realEstateSchema } from '../schemas/investments/realEstate'
import { cashSchema } from '../schemas/investments/cash'
import {
  calculateAccruedInterest,
  calculateBondCostBasis,
  calculateApproximateYTM
} from '../helpers/bondMath'
import {
  calculateSpotNotional,
  calculateFuturesNotional,
  calculateDaysToExpiry
} from '../helpers/commodityMath'
import {
  calculateRealEstateMetrics,
  calculateMortgagePayment
} from '../helpers/realEstateMath'
import {
  calculateCashMetrics,
  calculateInterest
} from '../helpers/cashMath'

describe('Batch 2 Investment Forms', () => {
  describe('Bond Schema & Math', () => {
    it('should validate a treasury bond', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 5)
      
      const validBond = {
        instrumentType: 'bond' as const,
        category: 'treasury' as const,
        issuer: 'U.S. Treasury',
        cusip: '912828XG6',
        couponRate: 2.5,
        frequency: 'semiannual' as const,
        dayCount: 'ACT/365' as const,
        maturity: futureDate.toISOString().split('T')[0],
        entryMode: 'lots' as const,
        lots: [{
          tradeDate: '2024-01-15',
          quantityBonds: 100,
          cleanPricePct: 99.5,
          fees: 25
        }],
        parPerBond: 1000,
        currency: 'USD',
        visibility: 'public' as const
      }

      const result = bondSchema.safeParse(validBond)
      expect(result.success).toBe(true)
    })

    it('should reject zero coupon bond with non-zero coupon rate', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 2)
      
      const invalidBond = {
        instrumentType: 'bond' as const,
        category: 'treasury' as const,
        issuer: 'U.S. Treasury',
        couponRate: 2.5, // Should be 0 for zero coupon
        frequency: 'zero' as const,
        maturity: futureDate.toISOString().split('T')[0],
        entryMode: 'average' as const,
        average: { avgCleanPricePct: 95, totalQuantityBonds: 50 },
        visibility: 'public' as const
      }

      const result = bondSchema.safeParse(invalidBond)
      expect(result.success).toBe(false)
    })

    it('should calculate accrued interest correctly', () => {
      const maturityDate = new Date('2025-12-15')
      const settlementDate = new Date('2024-06-15')
      
      const accruedInterest = calculateAccruedInterest(
        5.0, // 5% coupon
        1000, // par value
        'semiannual',
        'ACT/365',
        maturityDate,
        settlementDate
      )
      
      expect(accruedInterest).toBeGreaterThan(0)
    })

    it('should calculate approximate YTM', () => {
      const maturityDate = new Date()
      maturityDate.setFullYear(maturityDate.getFullYear() + 5)
      
      const ytm = calculateApproximateYTM(
        95, // 95% of par (discount)
        4.0, // 4% coupon
        maturityDate,
        1000
      )
      
      expect(ytm).toBeGreaterThan(4) // Should be higher than coupon for discount bond
    })
  })

  describe('Commodity Schema & Math', () => {
    it('should validate a spot commodity position', () => {
      const validSpotCommodity = {
        instrumentType: 'commodity' as const,
        mode: 'spot' as const,
        symbol: 'XAU',
        venue: 'Spot Market',
        currency: 'USD',
        entryDate: '2024-01-15',
        units: 10,
        unitType: 'oz',
        entryPricePerUnit: 2000,
        fees: 50,
        targets: { targetPrice: 2200, stopPrice: 1850 },
        visibility: 'public' as const
      }

      const result = commoditySchema.safeParse(validSpotCommodity)
      expect(result.success).toBe(true)
    })

    it('should validate a futures commodity position', () => {
      const validFuturesCommodity = {
        instrumentType: 'commodity' as const,
        mode: 'futures' as const,
        symbol: 'CL',
        venue: 'NYMEX',
        currency: 'USD',
        entryDate: '2024-01-15',
        contractCode: 'CLZ5',
        contractMonth: 'Z',
        contractYear: 2025,
        contracts: 5,
        multiplier: 1000,
        tickSize: 0.01,
        tickValue: 10,
        entryPricePerUnitFut: 75.50,
        marginPosted: 25000,
        visibility: 'friends' as const
      }

      const result = commoditySchema.safeParse(validFuturesCommodity)
      expect(result.success).toBe(true)
    })

    it('should reject spot commodity without required fields', () => {
      const invalidSpotCommodity = {
        instrumentType: 'commodity' as const,
        mode: 'spot' as const,
        symbol: 'XAU',
        currency: 'USD',
        entryDate: '2024-01-15',
        // Missing units, unitType, entryPricePerUnit
        visibility: 'public' as const
      }

      const result = commoditySchema.safeParse(invalidSpotCommodity)
      expect(result.success).toBe(false)
    })

    it('should calculate spot notional correctly', () => {
      const notional = calculateSpotNotional(10, 2000) // 10 oz at $2000/oz
      expect(notional).toBe(20000)
    })

    it('should calculate futures notional correctly', () => {
      const notional = calculateFuturesNotional(5, 1000, 75.50) // 5 contracts * 1000 multiplier * $75.50
      expect(notional).toBe(377500)
    })

    it('should calculate days to expiry for futures', () => {
      const dte = calculateDaysToExpiry('Z', 2025) // December 2025
      expect(dte).toBeGreaterThan(0)
    })
  })

  describe('Real Estate Schema & Math', () => {
    it('should validate a residential property', () => {
      const validProperty = {
        instrumentType: 'real_estate' as const,
        label: 'Main Street Duplex',
        propertyType: 'residential' as const,
        location: { country: 'United States', city: 'San Francisco' },
        currency: 'USD',
        acquisition: {
          purchaseDate: '2023-01-15',
          purchasePrice: 800000,
          closingCosts: 25000,
          improvementsToDate: 50000
        },
        financing: {
          hasMortgage: true,
          principal: 600000,
          interestRatePct: 6.5,
          termMonths: 360,
          monthlyPayment: 3789.99
        },
        income: {
          monthlyRent: 4500,
          otherMonthlyIncome: 200
        },
        expenses: {
          maintenance: 400,
          taxes: 1200,
          insurance: 300,
          management: 360
        },
        valuation: {
          currentValue: 900000,
          valuationDate: '2024-01-15'
        },
        visibility: 'private' as const
      }

      const result = realEstateSchema.safeParse(validProperty)
      expect(result.success).toBe(true)
    })

    it('should reject property with mortgage but missing principal', () => {
      const invalidProperty = {
        instrumentType: 'real_estate' as const,
        label: 'Test Property',
        propertyType: 'residential' as const,
        acquisition: {
          purchaseDate: '2023-01-15',
          purchasePrice: 500000
        },
        financing: {
          hasMortgage: true,
          // Missing principal and interestRatePct
        },
        valuation: {
          currentValue: 550000,
          valuationDate: '2024-01-15'
        },
        visibility: 'public' as const
      }

      const result = realEstateSchema.safeParse(invalidProperty)
      expect(result.success).toBe(false)
    })

    it('should calculate real estate metrics correctly', () => {
      const acquisition = {
        purchaseDate: '2023-01-15',
        purchasePrice: 500000,
        closingCosts: 15000,
        improvementsToDate: 25000
      }
      
      const valuation = {
        currentValue: 600000,
        valuationDate: '2024-01-15'
      }
      
      const income = {
        monthlyRent: 3000,
        otherMonthlyIncome: 100
      }
      
      const expenses = {
        maintenance: 200,
        taxes: 800,
        insurance: 150,
        management: 240
      }

      const metrics = calculateRealEstateMetrics(acquisition, valuation, income, expenses)
      
      expect(metrics.totalCostBasis).toBe(540000) // 500k + 15k + 25k
      expect(metrics.equity).toBe(600000) // No mortgage
      expect(metrics.noi).toBe(20520) // (3100 - 1390) * 12 = 1710 * 12
      expect(metrics.capRate).toBeCloseTo(3.42, 1) // 20520 / 600000 * 100
      expect(metrics.unrealizedPL).toBe(60000) // 600k - 540k
    })

    it('should calculate mortgage payment correctly', () => {
      const payment = calculateMortgagePayment(
        400000, // $400k loan
        6.5,     // 6.5% annual rate
        360      // 30 years
      )
      
      expect(payment).toBeCloseTo(2528, 0) // Approximately $2,528/month
    })
  })

  describe('Cash Schema & Math', () => {
    it('should validate a cash position', () => {
      const validCash = {
        instrumentType: 'cash' as const,
        label: 'Chase High Yield Savings',
        institution: 'JPMorgan Chase',
        currency: 'USD',
        amount: 50000,
        apyPct: 4.5,
        compounding: 'monthly' as const,
        autoAccrue: true,
        notes: 'Emergency fund',
        visibility: 'private' as const
      }

      const result = cashSchema.safeParse(validCash)
      expect(result.success).toBe(true)
    })

    it('should reject negative amount', () => {
      const invalidCash = {
        instrumentType: 'cash' as const,
        label: 'Test Account',
        currency: 'USD',
        amount: -1000, // Invalid: negative
        visibility: 'public' as const
      }

      const result = cashSchema.safeParse(invalidCash)
      expect(result.success).toBe(false)
    })

    it('should reject invalid currency code', () => {
      const invalidCash = {
        instrumentType: 'cash' as const,
        label: 'Test Account',
        currency: 'usd', // Invalid: lowercase
        amount: 1000,
        visibility: 'public' as const
      }

      const result = cashSchema.safeParse(invalidCash)
      expect(result.success).toBe(false)
    })

    it('should calculate monthly compound interest correctly', () => {
      const interest = calculateInterest(
        10000,     // $10k principal
        4.5,       // 4.5% APY
        'monthly', // Monthly compounding
        30         // 30 days
      )
      
      expect(interest).toBeCloseTo(37, 0) // Approximately $37 for one month
    })

    it('should calculate cash metrics correctly', () => {
      const metrics = calculateCashMetrics(
        25000,     // $25k balance
        4.8,       // 4.8% APY
        'daily'    // Daily compounding
      )
      
      expect(metrics.currentBalance).toBe(25000)
      expect(metrics.projectedAnnualInterest).toBeCloseTo(1229, 0) // ~$1,229/year with daily compounding
      expect(metrics.effectiveAnnualRate).toBeGreaterThan(4.8) // EAR > nominal for daily compounding
      expect(metrics.futureValueOneYear).toBeCloseTo(26229, 0) // ~$26,229 after 1 year with daily compounding
    })

    it('should handle zero APY correctly', () => {
      const metrics = calculateCashMetrics(10000, 0, 'monthly')
      
      expect(metrics.projectedMonthlyInterest).toBe(0)
      expect(metrics.projectedAnnualInterest).toBe(0)
      expect(metrics.effectiveAnnualRate).toBe(0)
      expect(metrics.futureValueOneYear).toBe(10000)
    })
  })
})
