// Commodity calculation helpers

// Calculate notional value for spot commodities
export function calculateSpotNotional(
  units: number,
  pricePerUnit: number
): number {
  return units * pricePerUnit
}

// Calculate notional value for futures
export function calculateFuturesNotional(
  contracts: number,
  multiplier: number,
  pricePerUnit: number
): number {
  return contracts * multiplier * pricePerUnit
}

// Calculate P/L for spot commodities
export function calculateSpotPL(
  units: number,
  entryPrice: number,
  currentPrice: number
): number {
  return units * (currentPrice - entryPrice)
}

// Calculate P/L for futures
export function calculateFuturesPL(
  contracts: number,
  multiplier: number,
  entryPrice: number,
  currentPrice: number
): number {
  return contracts * multiplier * (currentPrice - entryPrice)
}

// Calculate days to expiry for futures contracts
export function calculateDaysToExpiry(
  contractMonth: string,
  contractYear: number
): number {
  // Contract month mapping (standard futures notation)
  const monthMap: Record<string, number> = {
    'F': 0,  // January
    'G': 1,  // February
    'H': 2,  // March
    'J': 3,  // April
    'K': 4,  // May
    'M': 5,  // June
    'N': 6,  // July
    'Q': 7,  // August
    'U': 8,  // September
    'V': 9,  // October
    'X': 10, // November
    'Z': 11  // December
  }

  const month = monthMap[contractMonth]
  if (month === undefined) {
    return 0 // Invalid month code
  }

  // Assume expiry on last business day of contract month
  const expiryDate = new Date(contractYear, month + 1, 0) // Last day of month
  
  // Adjust to last business day (rough approximation)
  while (expiryDate.getDay() === 0 || expiryDate.getDay() === 6) {
    expiryDate.setDate(expiryDate.getDate() - 1)
  }

  const today = new Date()
  const diffTime = expiryDate.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

// Calculate margin requirement estimate (simplified)
export function calculateEstimatedMargin(
  contracts: number,
  multiplier: number,
  pricePerUnit: number,
  marginRate: number = 0.05 // 5% default
): number {
  const notional = calculateFuturesNotional(contracts, multiplier, pricePerUnit)
  return notional * marginRate
}

// Format contract month/year for display
export function formatContractCode(
  baseSymbol: string,
  contractMonth: string,
  contractYear: number
): string {
  const yearSuffix = contractYear.toString().slice(-1)
  return `${baseSymbol}${contractMonth}${yearSuffix}`
}

// Parse contract code back to components
export function parseContractCode(
  contractCode: string
): { baseSymbol: string; month: string; year: number } | null {
  // Simple regex for standard futures notation (e.g., CLZ5, NGH6)
  const match = contractCode.match(/^([A-Z]+)([FGHJKMNQUVXZ])(\d)$/)
  
  if (!match) {
    return null
  }

  const [, baseSymbol, month, yearDigit] = match
  const currentYear = new Date().getFullYear()
  const currentDecade = Math.floor(currentYear / 10) * 10
  
  // Assume year is in current or next decade
  let year = currentDecade + parseInt(yearDigit)
  if (year < currentYear) {
    year += 10
  }

  return { baseSymbol, month, year }
}

// Common commodity symbols and their properties
export const COMMODITY_INFO: Record<string, {
  name: string
  unitType: string
  standardMultiplier?: number
  venue?: string
}> = {
  'CL': { name: 'Crude Oil WTI', unitType: 'bbl', standardMultiplier: 1000, venue: 'NYMEX' },
  'NG': { name: 'Natural Gas', unitType: 'MMBtu', standardMultiplier: 10000, venue: 'NYMEX' },
  'GC': { name: 'Gold', unitType: 'oz', standardMultiplier: 100, venue: 'COMEX' },
  'SI': { name: 'Silver', unitType: 'oz', standardMultiplier: 5000, venue: 'COMEX' },
  'HG': { name: 'Copper', unitType: 'lb', standardMultiplier: 25000, venue: 'COMEX' },
  'ZC': { name: 'Corn', unitType: 'bu', standardMultiplier: 5000, venue: 'CBOT' },
  'ZS': { name: 'Soybeans', unitType: 'bu', standardMultiplier: 5000, venue: 'CBOT' },
  'ZW': { name: 'Wheat', unitType: 'bu', standardMultiplier: 5000, venue: 'CBOT' },
  'XAU': { name: 'Gold Spot', unitType: 'oz' },
  'XAG': { name: 'Silver Spot', unitType: 'oz' },
  'WTI': { name: 'WTI Crude Spot', unitType: 'bbl' },
  'BRENT': { name: 'Brent Crude Spot', unitType: 'bbl' }
}

// Get commodity info by symbol
export function getCommodityInfo(symbol: string) {
  // Try exact match first
  if (COMMODITY_INFO[symbol]) {
    return COMMODITY_INFO[symbol]
  }

  // Try parsing as futures contract
  const parsed = parseContractCode(symbol)
  if (parsed && COMMODITY_INFO[parsed.baseSymbol]) {
    return COMMODITY_INFO[parsed.baseSymbol]
  }

  // Default fallback
  return {
    name: symbol,
    unitType: 'units'
  }
}

// Calculate position cost basis
export function calculateCommodityCostBasis(
  mode: 'spot' | 'futures',
  quantity: number, // units for spot, contracts for futures
  entryPrice: number,
  multiplier: number = 1,
  fees: number = 0
): number {
  if (mode === 'spot') {
    return quantity * entryPrice + fees
  } else {
    return quantity * multiplier * entryPrice + fees
  }
}
