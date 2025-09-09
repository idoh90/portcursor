import { Parser } from 'expr-eval'
import type { CustomLot, CustomAverage, CustomDefinition, CustomState } from '../schemas/investments/custom'

// Calculate cost basis from lots
export function calculateCostBasisFromLots(lots: CustomLot[]): number {
  return lots.reduce((total, lot) => {
    return total + (lot.quantity * lot.unitCost) + (lot.fees || 0)
  }, 0)
}

// Calculate cost basis from average
export function calculateCostBasisFromAverage(average: CustomAverage): number {
  return (average.totalQuantity * average.avgUnitCost) + (average.totalFees || 0)
}

// Calculate total quantity from lots
export function calculateTotalQuantityFromLots(lots: CustomLot[]): number {
  return lots.reduce((total, lot) => total + lot.quantity, 0)
}

// Calculate total fees from lots
export function calculateTotalFeesFromLots(lots: CustomLot[]): number {
  return lots.reduce((total, lot) => total + (lot.fees || 0), 0)
}

// Calculate weighted average cost per unit
export function calculateWeightedAverageCost(
  entryMode: 'lots' | 'average',
  lots?: CustomLot[],
  average?: CustomAverage
): number {
  if (entryMode === 'lots' && lots && lots.length > 0) {
    const totalQuantity = calculateTotalQuantityFromLots(lots)
    const totalCost = lots.reduce((sum, lot) => sum + (lot.quantity * lot.unitCost), 0)
    return totalQuantity > 0 ? totalCost / totalQuantity : 0
  } else if (entryMode === 'average' && average) {
    return average.avgUnitCost
  }
  return 0
}

// Calculate current notional value
export function calculateNotional(
  quantity: number,
  markPrice: number,
  multiplier: number = 1
): number {
  return quantity * markPrice * multiplier
}

// Standard P/L calculation
export function calculateStandardPL(
  quantity: number,
  avgCost: number,
  markPrice: number,
  multiplier: number = 1,
  feesTotal: number = 0
): number {
  return (markPrice - avgCost) * quantity * multiplier - feesTotal
}

// Safe expression evaluator
const parser = new Parser()

export function evaluateCustomExpression(
  expression: string,
  variables: {
    quantity: number
    avgCost: number
    mark: number
    multiplier: number
    feesTotal: number
  }
): { result: number; error?: string } {
  try {
    // Parse and evaluate the expression
    const expr = parser.parse(expression)
    const result = expr.evaluate(variables)
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return { result: 0, error: 'Expression must evaluate to a finite number' }
    }
    
    return { result }
  } catch (error) {
    return { 
      result: 0, 
      error: error instanceof Error ? error.message : 'Invalid expression' 
    }
  }
}

// Test expression with sample data
export function testExpression(expression: string): { result: number; error?: string } {
  return evaluateCustomExpression(expression, {
    quantity: 100,
    avgCost: 50,
    mark: 55,
    multiplier: 1,
    feesTotal: 10
  })
}

// Calculate custom metrics
export interface CustomMetrics {
  totalQuantity: number
  costBasis: number
  avgCost: number
  notional: number
  unrealizedPL: number
  feesTotal: number
  plError?: string
}

export function calculateCustomMetrics(
  definition: CustomDefinition,
  state: CustomState
): CustomMetrics {
  const { entryMode, multiplier = 1 } = definition
  const { lots, average, markPrice = 0 } = state

  let totalQuantity = 0
  let costBasis = 0
  let feesTotal = 0
  let avgCost = 0

  if (entryMode === 'lots' && lots && lots.length > 0) {
    totalQuantity = calculateTotalQuantityFromLots(lots)
    costBasis = calculateCostBasisFromLots(lots)
    feesTotal = calculateTotalFeesFromLots(lots)
    avgCost = calculateWeightedAverageCost('lots', lots)
  } else if (entryMode === 'average' && average) {
    totalQuantity = average.totalQuantity
    costBasis = calculateCostBasisFromAverage(average)
    feesTotal = average.totalFees || 0
    avgCost = average.avgUnitCost
  }

  const notional = calculateNotional(totalQuantity, markPrice, multiplier)

  // Calculate unrealized P/L
  let unrealizedPL = 0
  let plError: string | undefined

  if (definition.plModel.type === 'standard') {
    unrealizedPL = calculateStandardPL(totalQuantity, avgCost, markPrice, multiplier, feesTotal)
  } else if (definition.plModel.type === 'expression' && definition.plModel.expression) {
    const result = evaluateCustomExpression(definition.plModel.expression, {
      quantity: totalQuantity,
      avgCost,
      mark: markPrice,
      multiplier,
      feesTotal
    })
    unrealizedPL = result.result
    plError = result.error
  }

  return {
    totalQuantity,
    costBasis,
    avgCost,
    notional,
    unrealizedPL,
    feesTotal,
    plError
  }
}

// Format quantity with custom precision
export function formatQuantity(quantity: number, precision: number = 2): string {
  return quantity.toFixed(precision)
}

// Validate slug uniqueness (would be checked against user's existing positions)
export function validateSlug(slug: string, existingSlugs: string[] = []): boolean {
  if (!slug) return true // Optional field
  return !existingSlugs.includes(slug.toLowerCase())
}

// Price adapter info
export const PRICE_ADAPTERS = {
  polygon: {
    name: 'Polygon.io',
    description: 'Stocks, options, forex, crypto',
    symbolExample: 'AAPL'
  },
  alpha: {
    name: 'Alpha Vantage',
    description: 'Stocks, forex, commodities',
    symbolExample: 'MSFT'
  },
  coingecko: {
    name: 'CoinGecko',
    description: 'Cryptocurrencies',
    symbolExample: 'bitcoin'
  },
  custom: {
    name: 'Custom API',
    description: 'Your own price feed',
    symbolExample: 'api.example.com/price'
  }
}

// Common custom instrument categories
export const CUSTOM_CATEGORIES = [
  'alternative',
  'collectible',
  'private-equity',
  'venture-capital',
  'hedge-fund',
  'private-debt',
  'infrastructure',
  'natural-resources',
  'art',
  'wine',
  'jewelry',
  'precious-metals',
  'sports-cards',
  'intellectual-property',
  'royalties',
  'other'
]

// Common unit names
export const COMMON_UNIT_NAMES = [
  'units',
  'shares',
  'tokens',
  'coins',
  'grams',
  'ounces',
  'pounds',
  'kilograms',
  'pieces',
  'items',
  'bottles',
  'cards',
  'contracts',
  'licenses',
  'points',
  'credits'
]

// Income calculation for custom instruments
export function calculateCustomIncome(
  income: NonNullable<CustomState['income']>,
  totalQuantity: number,
  avgCost: number,
  period: 'monthly' | 'annual' = 'annual'
): number {
  if (income.kind === 'none') return 0
  
  const value = income.value || 0
  
  if (income.kind === 'apy') {
    // APY based on cost basis
    const costBasis = totalQuantity * avgCost
    const annualIncome = costBasis * (value / 100)
    return period === 'monthly' ? annualIncome / 12 : annualIncome
  } else if (income.kind === 'fixed') {
    // Fixed amount per period
    return value
  }
  
  return 0
}
