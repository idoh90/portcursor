import type { Lot } from '../features/investments/types'

export interface LotMetrics {
  id: string
  quantity: number
  price: number
  fees: number
  date: string
  costBasis: number
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
}

export interface PositionMetrics {
  totalQuantity: number
  totalCost: number
  avgCost: number
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  todayChange: number
  todayChangePercent: number
  realizedPnL?: number
  totalReturn?: number
  totalReturnPercent?: number
}

export interface OptionBreakeven {
  breakeven: number
  maxProfit: number | null // null for unlimited
  maxLoss: number
  intrinsicValue: number
  timeValue: number
}

/**
 * Calculate metrics for a single lot
 */
export function calculateLotMetrics(lot: Lot, currentPrice: number): LotMetrics {
  const costBasis = lot.quantity * lot.price + (lot.fees || 0)
  const currentValue = lot.quantity * currentPrice
  const unrealizedPnL = currentValue - costBasis
  const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0

  return {
    id: lot.id,
    quantity: lot.quantity,
    price: lot.price,
    fees: lot.fees || 0,
    date: lot.date,
    costBasis,
    currentValue,
    unrealizedPnL,
    unrealizedPnLPercent,
  }
}

/**
 * Calculate position metrics from multiple lots
 */
export function calculatePositionMetrics(
  lots: Lot[], 
  currentPrice: number, 
  prevClose: number = 0
): PositionMetrics {
  if (lots.length === 0) {
    return {
      totalQuantity: 0,
      totalCost: 0,
      avgCost: 0,
      currentValue: 0,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      todayChange: 0,
      todayChangePercent: 0,
    }
  }

  // Calculate totals
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0)
  const totalCost = lots.reduce((sum, lot) => sum + (lot.quantity * lot.price + (lot.fees || 0)), 0)
  const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0
  const currentValue = totalQuantity * currentPrice
  const unrealizedPnL = currentValue - totalCost
  const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0

  // Calculate today's change
  const prevValue = totalQuantity * prevClose
  const todayChange = currentValue - prevValue
  const todayChangePercent = prevValue > 0 ? (todayChange / prevValue) * 100 : 0

  return {
    totalQuantity,
    totalCost,
    avgCost,
    currentValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    todayChange,
    todayChangePercent,
  }
}

/**
 * Calculate FIFO cost basis for tax lot matching
 */
export function calculateFIFOCostBasis(lots: Lot[], sellQuantity: number): {
  costBasis: number
  remainingLots: Lot[]
  soldLots: { lot: Lot; quantitySold: number }[]
} {
  const sortedLots = [...lots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  let remainingToSell = sellQuantity
  let costBasis = 0
  const remainingLots: Lot[] = []
  const soldLots: { lot: Lot; quantitySold: number }[] = []

  for (const lot of sortedLots) {
    if (remainingToSell <= 0) {
      remainingLots.push(lot)
      continue
    }

    if (lot.quantity <= remainingToSell) {
      // Sell entire lot
      costBasis += lot.quantity * lot.price + (lot.fees || 0)
      soldLots.push({ lot, quantitySold: lot.quantity })
      remainingToSell -= lot.quantity
    } else {
      // Partially sell lot
      const quantityToSell = remainingToSell
      const proportionalFees = (lot.fees || 0) * (quantityToSell / lot.quantity)
      
      costBasis += quantityToSell * lot.price + proportionalFees
      soldLots.push({ lot, quantitySold: quantityToSell })
      
      // Add remaining portion of lot
      remainingLots.push({
        ...lot,
        quantity: lot.quantity - quantityToSell,
        fees: (lot.fees || 0) - proportionalFees,
      })
      
      remainingToSell = 0
    }
  }

  return { costBasis, remainingLots, soldLots }
}

/**
 * Calculate option breakeven and profit/loss scenarios
 */
export function calculateOptionBreakeven(
  optionType: 'call' | 'put',
  action: 'buy' | 'sell',
  strike: number,
  premium: number,
  contracts: number = 1,
  multiplier: number = 100
): OptionBreakeven {
  const totalPremium = premium * contracts * multiplier
  
  if (optionType === 'call') {
    if (action === 'buy') {
      // Long call
      return {
        breakeven: strike + premium,
        maxProfit: null, // Unlimited
        maxLoss: totalPremium,
        intrinsicValue: Math.max(0, strike - premium), // Simplified
        timeValue: premium,
      }
    } else {
      // Short call
      return {
        breakeven: strike + premium,
        maxProfit: totalPremium,
        maxLoss: Infinity, // Unlimited loss potential
        intrinsicValue: Math.max(0, premium - strike), // Simplified
        timeValue: premium,
      }
    }
  } else {
    // Put options
    if (action === 'buy') {
      // Long put
      return {
        breakeven: strike - premium,
        maxProfit: (strike - premium) * contracts * multiplier,
        maxLoss: totalPremium,
        intrinsicValue: Math.max(0, strike - premium), // Simplified
        timeValue: premium,
      }
    } else {
      // Short put
      return {
        breakeven: strike - premium,
        maxProfit: totalPremium,
        maxLoss: (strike - premium) * contracts * multiplier,
        intrinsicValue: Math.max(0, premium - strike), // Simplified
        timeValue: premium,
      }
    }
  }
}

/**
 * Calculate bond yield to maturity (simplified)
 */
export function calculateBondYTM(
  faceValue: number,
  currentPrice: number,
  couponRate: number,
  yearsToMaturity: number
): number {
  // Simplified YTM calculation (approximation)
  const annualCoupon = faceValue * (couponRate / 100)
  const capitalGain = (faceValue - currentPrice) / yearsToMaturity
  const averagePrice = (faceValue + currentPrice) / 2
  
  return ((annualCoupon + capitalGain) / averagePrice) * 100
}

/**
 * Calculate real estate metrics
 */
export function calculateRealEstateMetrics(
  purchasePrice: number,
  currentValue: number,
  downPayment: number,
  monthlyRent: number = 0,
  monthlyExpenses: number = 0,
  yearsOwned: number = 1
): {
  totalReturn: number
  annualizedReturn: number
  cashOnCashReturn: number
  capRate: number
  equity: number
  netOperatingIncome: number
} {
  const equity = currentValue - (purchasePrice - downPayment) // Simplified (ignores mortgage paydown)
  const totalReturn = currentValue - purchasePrice
  const annualizedReturn = yearsOwned > 0 ? (Math.pow(currentValue / purchasePrice, 1 / yearsOwned) - 1) * 100 : 0
  
  const annualRent = monthlyRent * 12
  const annualExpenses = monthlyExpenses * 12
  const netOperatingIncome = annualRent - annualExpenses
  
  const cashOnCashReturn = downPayment > 0 ? (netOperatingIncome / downPayment) * 100 : 0
  const capRate = currentValue > 0 ? (netOperatingIncome / currentValue) * 100 : 0

  return {
    totalReturn,
    annualizedReturn,
    cashOnCashReturn,
    capRate,
    equity,
    netOperatingIncome,
  }
}

/**
 * Calculate crypto staking rewards
 */
export function calculateStakingRewards(
  principal: number,
  apy: number,
  stakingPeriodDays: number,
  compoundFrequency: number = 365 // Daily compounding
): {
  totalRewards: number
  effectiveAPY: number
  dailyRewards: number
} {
  const stakingPeriodYears = stakingPeriodDays / 365
  const effectiveAPY = Math.pow(1 + (apy / 100) / compoundFrequency, compoundFrequency) - 1
  const totalValue = principal * Math.pow(1 + effectiveAPY, stakingPeriodYears)
  const totalRewards = totalValue - principal
  const dailyRewards = totalRewards / stakingPeriodDays

  return {
    totalRewards,
    effectiveAPY: effectiveAPY * 100,
    dailyRewards,
  }
}

/**
 * Calculate portfolio diversification metrics
 */
export function calculateDiversificationMetrics(positions: {
  symbol: string
  value: number
  sector?: string
  assetClass?: string
}[]): {
  concentration: { symbol: string; percentage: number }[]
  sectorAllocation: { sector: string; percentage: number }[]
  assetClassAllocation: { assetClass: string; percentage: number }[]
  herfindahlIndex: number
} {
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)
  
  // Concentration by position
  const concentration = positions
    .map(pos => ({
      symbol: pos.symbol,
      percentage: (pos.value / totalValue) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage)

  // Sector allocation
  const sectorMap = new Map<string, number>()
  positions.forEach(pos => {
    const sector = pos.sector || 'Unknown'
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + pos.value)
  })
  const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, value]) => ({
    sector,
    percentage: (value / totalValue) * 100
  }))

  // Asset class allocation
  const assetClassMap = new Map<string, number>()
  positions.forEach(pos => {
    const assetClass = pos.assetClass || 'Unknown'
    assetClassMap.set(assetClass, (assetClassMap.get(assetClass) || 0) + pos.value)
  })
  const assetClassAllocation = Array.from(assetClassMap.entries()).map(([assetClass, value]) => ({
    assetClass,
    percentage: (value / totalValue) * 100
  }))

  // Herfindahl-Hirschman Index (concentration measure)
  const herfindahlIndex = concentration.reduce((sum, pos) => sum + Math.pow(pos.percentage, 2), 0)

  return {
    concentration,
    sectorAllocation,
    assetClassAllocation,
    herfindahlIndex,
  }
}
