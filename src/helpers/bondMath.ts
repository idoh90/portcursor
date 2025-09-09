import type { BondFrequency, DayCount } from '../schemas/investments/bond'

// Days in year based on day count convention
export function getDaysInYear(dayCount: DayCount): number {
  switch (dayCount) {
    case 'ACT/365':
      return 365
    case 'ACT/360':
      return 360
    case '30/360':
      return 360
    default:
      return 365
  }
}

// Coupon payments per year
export function getCouponFrequency(frequency: BondFrequency): number {
  switch (frequency) {
    case 'zero':
      return 0
    case 'annual':
      return 1
    case 'semiannual':
      return 2
    case 'quarterly':
      return 4
    case 'monthly':
      return 12
    default:
      return 0
  }
}

// Calculate days between two dates
export function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Get last coupon date before a given date
export function getLastCouponDate(
  maturityDate: Date,
  frequency: BondFrequency,
  referenceDate: Date = new Date()
): Date {
  if (frequency === 'zero') {
    return maturityDate // No coupons, use maturity
  }

  const frequencyCount = getCouponFrequency(frequency)
  const monthsPerCoupon = 12 / frequencyCount
  
  // Start from maturity and work backwards
  let couponDate = new Date(maturityDate)
  
  while (couponDate > referenceDate) {
    couponDate.setMonth(couponDate.getMonth() - monthsPerCoupon)
  }
  
  return couponDate
}

// Get next coupon date after a given date
export function getNextCouponDate(
  maturityDate: Date,
  frequency: BondFrequency,
  referenceDate: Date = new Date()
): Date {
  if (frequency === 'zero') {
    return maturityDate // No coupons, use maturity
  }

  const lastCoupon = getLastCouponDate(maturityDate, frequency, referenceDate)
  const frequencyCount = getCouponFrequency(frequency)
  const monthsPerCoupon = 12 / frequencyCount
  
  const nextCoupon = new Date(lastCoupon)
  nextCoupon.setMonth(nextCoupon.getMonth() + monthsPerCoupon)
  
  return nextCoupon
}

// Calculate accrued interest
export function calculateAccruedInterest(
  couponRate: number, // Annual percentage
  parValue: number,
  frequency: BondFrequency,
  dayCount: DayCount,
  maturityDate: Date,
  settlementDate: Date = new Date()
): number {
  if (frequency === 'zero' || couponRate === 0) {
    return 0
  }

  const lastCouponDate = getLastCouponDate(maturityDate, frequency, settlementDate)
  const nextCouponDate = getNextCouponDate(maturityDate, frequency, settlementDate)
  
  const daysSinceLastCoupon = daysBetween(lastCouponDate, settlementDate)
  const daysBetweenCoupons = daysBetween(lastCouponDate, nextCouponDate)
  
  const couponPayment = (couponRate / 100) * parValue / getCouponFrequency(frequency)
  
  let accruedFraction: number
  
  if (dayCount === '30/360') {
    // 30/360 uses 30 days per month regardless of actual days
    accruedFraction = daysSinceLastCoupon / daysBetweenCoupons
  } else {
    // ACT/365 and ACT/360 use actual days
    accruedFraction = daysSinceLastCoupon / daysBetweenCoupons
  }
  
  return couponPayment * accruedFraction
}

// Calculate dirty price (clean price + accrued interest)
export function calculateDirtyPrice(
  cleanPricePct: number,
  accruedInterest: number,
  parValue: number
): number {
  const cleanPrice = (cleanPricePct / 100) * parValue
  return cleanPrice + accruedInterest
}

// Calculate cost basis for bond lots
export function calculateBondCostBasis(
  lots: Array<{
    quantityBonds: number
    cleanPricePct: number
    fees?: number
    tradeDate: string
  }>,
  couponRate: number,
  frequency: BondFrequency,
  dayCount: DayCount,
  maturityDate: Date,
  parValue: number = 1000
): number {
  return lots.reduce((total, lot) => {
    const settlementDate = new Date(lot.tradeDate)
    const accruedInterest = calculateAccruedInterest(
      couponRate,
      parValue,
      frequency,
      dayCount,
      maturityDate,
      settlementDate
    )
    
    const dirtyPrice = calculateDirtyPrice(lot.cleanPricePct, accruedInterest, parValue)
    const lotCost = lot.quantityBonds * dirtyPrice + (lot.fees || 0)
    
    return total + lotCost
  }, 0)
}

// Calculate market value
export function calculateBondMarketValue(
  quantityBonds: number,
  markCleanPricePct: number,
  couponRate: number,
  frequency: BondFrequency,
  dayCount: DayCount,
  maturityDate: Date,
  parValue: number = 1000,
  valuationDate: Date = new Date()
): number {
  const accruedInterest = calculateAccruedInterest(
    couponRate,
    parValue,
    frequency,
    dayCount,
    maturityDate,
    valuationDate
  )
  
  const dirtyPrice = calculateDirtyPrice(markCleanPricePct, accruedInterest, parValue)
  return quantityBonds * dirtyPrice
}

// Approximate Yield to Maturity (simplified calculation)
export function calculateApproximateYTM(
  cleanPricePct: number,
  couponRate: number,
  maturityDate: Date,
  parValue: number = 1000,
  currentDate: Date = new Date()
): number {
  const currentPrice = (cleanPricePct / 100) * parValue
  const yearsToMaturity = (maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
  
  if (yearsToMaturity <= 0) {
    return 0
  }
  
  // Simplified YTM approximation formula
  const annualCoupon = (couponRate / 100) * parValue
  const capitalGainPerYear = (parValue - currentPrice) / yearsToMaturity
  const averagePrice = (currentPrice + parValue) / 2
  
  const approximateYTM = (annualCoupon + capitalGainPerYear) / averagePrice
  
  return approximateYTM * 100 // Return as percentage
}

// Calculate total quantity from lots
export function calculateTotalQuantity(
  lots: Array<{ quantityBonds: number }>
): number {
  return lots.reduce((total, lot) => total + lot.quantityBonds, 0)
}

// Calculate weighted average clean price
export function calculateWeightedAverageCleanPrice(
  lots: Array<{ quantityBonds: number; cleanPricePct: number }>
): number {
  const totalQuantity = calculateTotalQuantity(lots)
  if (totalQuantity === 0) return 0
  
  const weightedSum = lots.reduce((sum, lot) => {
    return sum + (lot.quantityBonds * lot.cleanPricePct)
  }, 0)
  
  return weightedSum / totalQuantity
}
