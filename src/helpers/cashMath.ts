// Cash position calculation helpers

// Get compounding frequency (times per year)
export function getCompoundingFrequency(compounding: 'daily' | 'monthly' | 'quarterly' | 'none'): number {
  switch (compounding) {
    case 'daily':
      return 365
    case 'monthly':
      return 12
    case 'quarterly':
      return 4
    case 'none':
      return 1
    default:
      return 12
  }
}

// Calculate interest for a given period
export function calculateInterest(
  principal: number,
  apyPct: number,
  compounding: 'daily' | 'monthly' | 'quarterly' | 'none',
  daysHeld: number = 30
): number {
  if (apyPct <= 0 || principal <= 0) return 0
  
  const annualRate = apyPct / 100
  const compoundingFreq = getCompoundingFrequency(compounding)
  
  if (compounding === 'none') {
    // Simple interest
    return principal * annualRate * (daysHeld / 365)
  }
  
  // Compound interest formula: A = P(1 + r/n)^(nt) - P
  const periodsPerYear = compoundingFreq
  const years = daysHeld / 365
  const ratePerPeriod = annualRate / periodsPerYear
  const totalPeriods = periodsPerYear * years
  
  const finalAmount = principal * Math.pow(1 + ratePerPeriod, totalPeriods)
  return finalAmount - principal
}

// Calculate projected monthly interest
export function calculateMonthlyInterest(
  principal: number,
  apyPct: number,
  compounding: 'daily' | 'monthly' | 'quarterly' | 'none'
): number {
  return calculateInterest(principal, apyPct, compounding, 30)
}

// Calculate projected annual interest
export function calculateAnnualInterest(
  principal: number,
  apyPct: number,
  compounding: 'daily' | 'monthly' | 'quarterly' | 'none'
): number {
  return calculateInterest(principal, apyPct, compounding, 365)
}

// Calculate effective annual rate (for comparison purposes)
export function calculateEffectiveAnnualRate(
  apyPct: number,
  compounding: 'daily' | 'monthly' | 'quarterly' | 'none'
): number {
  if (apyPct <= 0) return 0
  
  const nominalRate = apyPct / 100
  const compoundingFreq = getCompoundingFrequency(compounding)
  
  if (compounding === 'none') {
    return apyPct // Simple interest = nominal rate
  }
  
  // EAR = (1 + r/n)^n - 1
  const ear = Math.pow(1 + nominalRate / compoundingFreq, compoundingFreq) - 1
  return ear * 100 // Return as percentage
}

// Get next interest credit date
export function getNextInterestCreditDate(
  compounding: 'daily' | 'monthly' | 'quarterly' | 'none',
  referenceDate: Date = new Date()
): Date {
  const nextDate = new Date(referenceDate)
  
  switch (compounding) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'none':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
  }
  
  return nextDate
}

// Calculate accrued interest year-to-date
export function calculateAccruedInterestYTD(
  principal: number,
  apyPct: number,
  compounding: 'daily' | 'monthly' | 'quarterly' | 'none',
  accountOpenDate: Date,
  currentDate: Date = new Date()
): number {
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1)
  const effectiveStartDate = accountOpenDate > startOfYear ? accountOpenDate : startOfYear
  
  const daysSinceStart = Math.max(0, 
    Math.floor((currentDate.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24))
  )
  
  return calculateInterest(principal, apyPct, compounding, daysSinceStart)
}

// Calculate future value after specified time
export function calculateFutureValue(
  principal: number,
  apyPct: number,
  compounding: 'daily' | 'monthly' | 'quarterly' | 'none',
  years: number
): number {
  if (years <= 0) return principal
  
  const interest = calculateInterest(principal, apyPct, compounding, years * 365)
  return principal + interest
}

// Convert between different currency amounts (placeholder for FX integration)
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number = 1
): { amount: number; rate: number } {
  if (fromCurrency === toCurrency) {
    return { amount, rate: 1 }
  }
  
  // In a real implementation, this would fetch live exchange rates
  return {
    amount: amount * exchangeRate,
    rate: exchangeRate
  }
}

// Validate currency code
export function isValidCurrencyCode(currency: string): boolean {
  // Basic validation for 3-letter uppercase currency codes
  return /^[A-Z]{3}$/.test(currency)
}

// Common currency information
export const CURRENCY_INFO: Record<string, {
  name: string
  symbol: string
  decimals: number
}> = {
  'USD': { name: 'US Dollar', symbol: '$', decimals: 2 },
  'EUR': { name: 'Euro', symbol: '€', decimals: 2 },
  'GBP': { name: 'British Pound', symbol: '£', decimals: 2 },
  'JPY': { name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  'CHF': { name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  'CAD': { name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  'AUD': { name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  'CNY': { name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  'INR': { name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  'KRW': { name: 'South Korean Won', symbol: '₩', decimals: 0 },
  'BRL': { name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  'MXN': { name: 'Mexican Peso', symbol: '$', decimals: 2 }
}

// Get currency information
export function getCurrencyInfo(currency: string) {
  return CURRENCY_INFO[currency] || {
    name: currency,
    symbol: currency,
    decimals: 2
  }
}

// Format currency amount
export function formatCashAmount(
  amount: number,
  currency: string = 'USD'
): string {
  const info = getCurrencyInfo(currency)
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: info.decimals,
    maximumFractionDigits: info.decimals
  }).format(amount)
}

// Cash position metrics
export interface CashMetrics {
  currentBalance: number
  projectedMonthlyInterest: number
  projectedAnnualInterest: number
  effectiveAnnualRate: number
  accruedInterestYTD: number
  nextCreditDate: Date
  futureValueOneYear: number
}

// Calculate all cash metrics
export function calculateCashMetrics(
  amount: number,
  apyPct: number = 0,
  compounding: 'daily' | 'monthly' | 'quarterly' | 'none' = 'monthly',
  accountOpenDate: Date = new Date(),
  currentDate: Date = new Date()
): CashMetrics {
  const projectedMonthlyInterest = calculateMonthlyInterest(amount, apyPct, compounding)
  const projectedAnnualInterest = calculateAnnualInterest(amount, apyPct, compounding)
  const effectiveAnnualRate = calculateEffectiveAnnualRate(apyPct, compounding)
  const accruedInterestYTD = calculateAccruedInterestYTD(amount, apyPct, compounding, accountOpenDate, currentDate)
  const nextCreditDate = getNextInterestCreditDate(compounding, currentDate)
  const futureValueOneYear = calculateFutureValue(amount, apyPct, compounding, 1)

  return {
    currentBalance: amount,
    projectedMonthlyInterest,
    projectedAnnualInterest,
    effectiveAnnualRate,
    accruedInterestYTD,
    nextCreditDate,
    futureValueOneYear
  }
}
