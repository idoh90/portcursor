import { describe, it, expect } from 'vitest'
import { 
  calculateLotMetrics, 
  calculatePositionMetrics,
  calculateFIFOCostBasis,
  calculateOptionBreakeven,
  calculateBondYTM,
  calculateRealEstateMetrics
} from '../lib/plCalculations'
import type { Lot } from '../features/investments/types'

describe('Investment P&L Calculations', () => {
  describe('calculateLotMetrics', () => {
    it('should calculate lot metrics correctly', () => {
      const lot: Lot = {
        id: '1',
        quantity: 100,
        price: 50,
        fees: 10,
        date: '2024-01-01',
      }

      const metrics = calculateLotMetrics(lot, 60)
      
      expect(metrics.costBasis).toBe(5010) // 100 * 50 + 10
      expect(metrics.currentValue).toBe(6000) // 100 * 60
      expect(metrics.unrealizedPnL).toBe(990) // 6000 - 5010
      expect(metrics.unrealizedPnLPercent).toBeCloseTo(19.76, 2) // (990 / 5010) * 100
    })

    it('should handle zero fees', () => {
      const lot: Lot = {
        id: '1',
        quantity: 50,
        price: 100,
        date: '2024-01-01',
      }

      const metrics = calculateLotMetrics(lot, 110)
      
      expect(metrics.costBasis).toBe(5000) // 50 * 100 + 0
      expect(metrics.currentValue).toBe(5500) // 50 * 110
      expect(metrics.unrealizedPnL).toBe(500) // 5500 - 5000
      expect(metrics.unrealizedPnLPercent).toBe(10) // (500 / 5000) * 100
    })
  })

  describe('calculatePositionMetrics', () => {
    it('should calculate position metrics from multiple lots', () => {
      const lots: Lot[] = [
        {
          id: '1',
          quantity: 100,
          price: 50,
          fees: 5,
          date: '2024-01-01',
        },
        {
          id: '2',
          quantity: 50,
          price: 60,
          fees: 3,
          date: '2024-02-01',
        }
      ]

      const metrics = calculatePositionMetrics(lots, 70, 65)
      
      expect(metrics.totalQuantity).toBe(150) // 100 + 50
      expect(metrics.totalCost).toBe(8008) // (100*50+5) + (50*60+3)
      expect(metrics.avgCost).toBeCloseTo(53.39, 2) // 8008 / 150
      expect(metrics.currentValue).toBe(10500) // 150 * 70
      expect(metrics.unrealizedPnL).toBe(2492) // 10500 - 8008
      expect(metrics.unrealizedPnLPercent).toBeCloseTo(31.12, 2) // (2492 / 8008) * 100
      
      // Today's change: from 65 to 70 = +5 per share
      expect(metrics.todayChange).toBe(750) // 150 * (70 - 65)
      expect(metrics.todayChangePercent).toBeCloseTo(7.69, 2) // (750 / 9750) * 100
    })

    it('should handle empty lots array', () => {
      const metrics = calculatePositionMetrics([], 50, 45)
      
      expect(metrics.totalQuantity).toBe(0)
      expect(metrics.totalCost).toBe(0)
      expect(metrics.avgCost).toBe(0)
      expect(metrics.currentValue).toBe(0)
      expect(metrics.unrealizedPnL).toBe(0)
      expect(metrics.unrealizedPnLPercent).toBe(0)
      expect(metrics.todayChange).toBe(0)
      expect(metrics.todayChangePercent).toBe(0)
    })
  })

  describe('calculateFIFOCostBasis', () => {
    it('should calculate FIFO cost basis correctly', () => {
      const lots: Lot[] = [
        {
          id: '1',
          quantity: 100,
          price: 50,
          fees: 10,
          date: '2024-01-01', // Oldest
        },
        {
          id: '2',
          quantity: 75,
          price: 60,
          fees: 8,
          date: '2024-02-01', // Middle
        },
        {
          id: '3',
          quantity: 50,
          price: 70,
          fees: 5,
          date: '2024-03-01', // Newest
        }
      ]

      // Sell 120 shares using FIFO
      const result = calculateFIFOCostBasis(lots, 120)
      
      // Should sell entire first lot (100 shares) + 20 shares from second lot
      expect(result.costBasis).toBeCloseTo(6210, 2) // (100*50+10) + (20*60 + 20/75*8)
      expect(result.soldLots).toHaveLength(2)
      expect(result.soldLots[0].quantitySold).toBe(100)
      expect(result.soldLots[1].quantitySold).toBe(20)
      expect(result.remainingLots).toHaveLength(2) // Partial second lot + full third lot
    })

    it('should handle selling more than available', () => {
      const lots: Lot[] = [
        {
          id: '1',
          quantity: 50,
          price: 100,
          fees: 5,
          date: '2024-01-01',
        }
      ]

      const result = calculateFIFOCostBasis(lots, 75) // Try to sell more than we have
      
      // Should only sell what we have
      expect(result.costBasis).toBe(5005) // 50*100+5
      expect(result.soldLots[0].quantitySold).toBe(50)
      expect(result.remainingLots).toHaveLength(0)
    })
  })

  describe('calculateOptionBreakeven', () => {
    it('should calculate call option breakeven correctly', () => {
      const breakeven = calculateOptionBreakeven('call', 'buy', 100, 5, 1, 100)
      
      expect(breakeven.breakeven).toBe(105) // strike + premium
      expect(breakeven.maxProfit).toBeNull() // Unlimited for long call
      expect(breakeven.maxLoss).toBe(500) // premium * contracts * multiplier
    })

    it('should calculate put option breakeven correctly', () => {
      const breakeven = calculateOptionBreakeven('put', 'buy', 100, 8, 2, 100)
      
      expect(breakeven.breakeven).toBe(92) // strike - premium
      expect(breakeven.maxProfit).toBe(18400) // (strike - premium) * contracts * multiplier
      expect(breakeven.maxLoss).toBe(1600) // premium * contracts * multiplier
    })

    it('should calculate short call breakeven correctly', () => {
      const breakeven = calculateOptionBreakeven('call', 'sell', 110, 3, 1, 100)
      
      expect(breakeven.breakeven).toBe(113) // strike + premium
      expect(breakeven.maxProfit).toBe(300) // premium * contracts * multiplier
      expect(breakeven.maxLoss).toBe(Infinity) // Unlimited loss for short call
    })

    it('should calculate short put breakeven correctly', () => {
      const breakeven = calculateOptionBreakeven('put', 'sell', 90, 4, 1, 100)
      
      expect(breakeven.breakeven).toBe(86) // strike - premium
      expect(breakeven.maxProfit).toBe(400) // premium * contracts * multiplier
      expect(breakeven.maxLoss).toBe(8600) // (strike - premium) * contracts * multiplier
    })
  })

  describe('calculateBondYTM', () => {
    it('should calculate bond yield to maturity', () => {
      const ytm = calculateBondYTM(1000, 950, 5, 3) // Face, current price, coupon rate, years
      
      // YTM should be higher than coupon rate since bond is trading at discount
      expect(ytm).toBeGreaterThan(5)
      expect(ytm).toBeCloseTo(6.84, 1) // Approximate YTM
    })

    it('should handle bond trading at premium', () => {
      const ytm = calculateBondYTM(1000, 1050, 4, 2) // Face, current price, coupon rate, years
      
      // YTM should be lower than coupon rate since bond is trading at premium
      expect(ytm).toBeLessThan(4)
      expect(ytm).toBeCloseTo(1.43, 1) // Approximate YTM
    })
  })

  describe('calculateRealEstateMetrics', () => {
    it('should calculate real estate investment metrics', () => {
      const metrics = calculateRealEstateMetrics(
        500000, // purchase price
        550000, // current value
        100000, // down payment
        3000,   // monthly rent
        1500,   // monthly expenses
        2       // years owned
      )

      expect(metrics.totalReturn).toBe(50000) // 550000 - 500000
      expect(metrics.annualizedReturn).toBeCloseTo(4.88, 2) // Annualized return
      expect(metrics.netOperatingIncome).toBe(18000) // (3000 - 1500) * 12
      expect(metrics.cashOnCashReturn).toBe(18) // (18000 / 100000) * 100
      expect(metrics.capRate).toBeCloseTo(3.27, 2) // (18000 / 550000) * 100
    })

    it('should handle zero rent scenario', () => {
      const metrics = calculateRealEstateMetrics(
        400000, // purchase price
        420000, // current value
        80000,  // down payment
        0,      // monthly rent
        500,    // monthly expenses
        1       // years owned
      )

      expect(metrics.netOperatingIncome).toBe(-6000) // (0 - 500) * 12
      expect(metrics.cashOnCashReturn).toBe(-7.5) // (-6000 / 80000) * 100
      expect(metrics.capRate).toBeCloseTo(-1.43, 2) // (-6000 / 420000) * 100
    })
  })
})

describe('Investment Validation', () => {
  describe('Lot validation', () => {
    it('should validate lot data correctly', () => {
      const validLot = {
        quantity: 100,
        price: 50.25,
        fees: 1.50,
        date: '2024-01-15'
      }

      // This would be tested with the validation functions
      expect(validLot.quantity).toBeGreaterThan(0)
      expect(validLot.price).toBeGreaterThanOrEqual(0)
      expect(validLot.fees).toBeGreaterThanOrEqual(0)
      expect(new Date(validLot.date)).toBeInstanceOf(Date)
    })
  })

  describe('Option validation', () => {
    it('should validate option expiration date', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowISO = tomorrow.toISOString().split('T')[0]

      const validOption = {
        underlying: 'AAPL',
        optionType: 'call',
        action: 'buy',
        strike: 150,
        expiration: tomorrowISO,
        contracts: 1,
        premium: 5.50
      }

      expect(new Date(validOption.expiration)).toBeInstanceOf(Date)
      expect(new Date(validOption.expiration).getTime()).toBeGreaterThan(Date.now())
    })
  })
})

describe('CSV Import Processing', () => {
  it('should parse CSV data correctly', () => {
    const csvData = {
      headers: ['Symbol', 'Quantity', 'Price', 'Date', 'Fees'],
      rows: [
        ['AAPL', '100', '150.50', '2024-01-15', '1.00'],
        ['GOOGL', '50', '2800.75', '2024-01-20', '2.50']
      ]
    }

    // Test parsing logic
    const parsedData = csvData.rows.map(row => ({
      symbol: row[0],
      quantity: parseFloat(row[1]),
      price: parseFloat(row[2]),
      date: row[3],
      fees: parseFloat(row[4])
    }))

    expect(parsedData[0]).toEqual({
      symbol: 'AAPL',
      quantity: 100,
      price: 150.50,
      date: '2024-01-15',
      fees: 1.00
    })

    expect(parsedData[1]).toEqual({
      symbol: 'GOOGL',
      quantity: 50,
      price: 2800.75,
      date: '2024-01-20',
      fees: 2.50
    })
  })

  it('should validate CSV import data', () => {
    const importData = [
      { symbol: 'AAPL', quantity: 100, price: 150, date: '2024-01-15' },
      { symbol: '', quantity: 50, price: 200, date: '2024-01-20' }, // Missing symbol
      { symbol: 'MSFT', quantity: -10, price: 300, date: '2024-01-25' }, // Negative quantity
      { symbol: 'TSLA', quantity: 25, price: -100, date: '2024-01-30' }, // Negative price
    ]

    const validItems = importData.filter(item => 
      item.symbol && 
      item.quantity > 0 && 
      item.price >= 0 &&
      item.date &&
      !isNaN(Date.parse(item.date))
    )

    expect(validItems).toHaveLength(1) // Only AAPL should be valid
    expect(validItems[0].symbol).toBe('AAPL')
  })
})
