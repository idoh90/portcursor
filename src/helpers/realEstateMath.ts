// Real estate calculation helpers

import type { 
  RealEstateAcquisition,
  RealEstateFinancing,
  RealEstateIncome,
  RealEstateExpenses,
  RealEstateValuation
} from '../schemas/investments/realEstate'

// Calculate total cost basis
export function calculateTotalCostBasis(acquisition: RealEstateAcquisition): number {
  const { purchasePrice, closingCosts = 0, improvementsToDate = 0 } = acquisition
  return purchasePrice + closingCosts + improvementsToDate
}

// Calculate equity (property value minus outstanding mortgage)
export function calculateEquity(
  currentValue: number,
  financing?: RealEstateFinancing
): number {
  if (!financing?.hasMortgage || !financing.principal) {
    return currentValue
  }
  
  // For simplicity, we'll use the original principal amount
  // In a real application, this would be the outstanding balance
  const outstandingPrincipal = financing.principal
  return Math.max(0, currentValue - outstandingPrincipal)
}

// Calculate Net Operating Income (NOI) - annual
export function calculateNOI(
  income?: RealEstateIncome,
  expenses?: RealEstateExpenses
): number {
  const monthlyIncome = (income?.monthlyRent || 0) + (income?.otherMonthlyIncome || 0)
  const monthlyExpenses = (expenses?.maintenance || 0) + 
                         (expenses?.taxes || 0) + 
                         (expenses?.insurance || 0) + 
                         (expenses?.management || 0)
  
  return (monthlyIncome - monthlyExpenses) * 12
}

// Calculate Cap Rate (NOI / Property Value)
export function calculateCapRate(
  noi: number,
  currentValue: number
): number {
  if (currentValue <= 0) return 0
  return (noi / currentValue) * 100 // Return as percentage
}

// Calculate monthly cash flow
export function calculateMonthlyCashFlow(
  income?: RealEstateIncome,
  expenses?: RealEstateExpenses,
  financing?: RealEstateFinancing
): number {
  const monthlyIncome = (income?.monthlyRent || 0) + (income?.otherMonthlyIncome || 0)
  const monthlyExpenses = (expenses?.maintenance || 0) + 
                         (expenses?.taxes || 0) + 
                         (expenses?.insurance || 0) + 
                         (expenses?.management || 0)
  
  const mortgagePayment = (financing?.hasMortgage && financing.monthlyPayment) ? 
                         financing.monthlyPayment : 0
  
  return monthlyIncome - monthlyExpenses - mortgagePayment
}

// Calculate unrealized P/L (current value - total cost basis)
export function calculateUnrealizedPL(
  currentValue: number,
  acquisition: RealEstateAcquisition
): number {
  const costBasis = calculateTotalCostBasis(acquisition)
  return currentValue - costBasis
}

// Calculate annual cash-on-cash return
export function calculateCashOnCashReturn(
  annualCashFlow: number,
  initialCashInvested: number
): number {
  if (initialCashInvested <= 0) return 0
  return (annualCashFlow / initialCashInvested) * 100 // Return as percentage
}

// Calculate loan-to-value ratio
export function calculateLTV(
  loanAmount: number,
  propertyValue: number
): number {
  if (propertyValue <= 0) return 0
  return (loanAmount / propertyValue) * 100 // Return as percentage
}

// Calculate debt service coverage ratio (NOI / Annual Debt Service)
export function calculateDSCR(
  noi: number,
  annualDebtService: number
): number {
  if (annualDebtService <= 0) return Infinity
  return noi / annualDebtService
}

// Calculate mortgage payment using loan amount, rate, and term
export function calculateMortgagePayment(
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number {
  if (principal <= 0 || annualInterestRate <= 0 || termMonths <= 0) {
    return 0
  }
  
  const monthlyRate = annualInterestRate / 100 / 12
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)
  const denominator = Math.pow(1 + monthlyRate, termMonths) - 1
  
  return numerator / denominator
}

// Calculate appreciation rate (annualized)
export function calculateAppreciationRate(
  purchasePrice: number,
  currentValue: number,
  purchaseDate: string,
  currentDate: string = new Date().toISOString()
): number {
  const purchase = new Date(purchaseDate)
  const current = new Date(currentDate)
  const yearsOwned = (current.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  
  if (yearsOwned <= 0 || purchasePrice <= 0) return 0
  
  // Calculate compound annual growth rate (CAGR)
  const cagr = Math.pow(currentValue / purchasePrice, 1 / yearsOwned) - 1
  return cagr * 100 // Return as percentage
}

// Calculate total return (appreciation + cash flow)
export function calculateTotalReturn(
  purchasePrice: number,
  currentValue: number,
  totalCashFlowReceived: number
): number {
  if (purchasePrice <= 0) return 0
  
  const totalReturn = (currentValue + totalCashFlowReceived - purchasePrice) / purchasePrice
  return totalReturn * 100 // Return as percentage
}

// Real estate metrics summary
export interface RealEstateMetrics {
  totalCostBasis: number
  equity: number
  noi: number
  capRate: number
  monthlyCashFlow: number
  unrealizedPL: number
  appreciationRate: number
  loanToValue: number
  dscr: number
}

// Calculate all metrics at once
export function calculateRealEstateMetrics(
  acquisition: RealEstateAcquisition,
  valuation: RealEstateValuation,
  income?: RealEstateIncome,
  expenses?: RealEstateExpenses,
  financing?: RealEstateFinancing
): RealEstateMetrics {
  const totalCostBasis = calculateTotalCostBasis(acquisition)
  const equity = calculateEquity(valuation.currentValue, financing)
  const noi = calculateNOI(income, expenses)
  const capRate = calculateCapRate(noi, valuation.currentValue)
  const monthlyCashFlow = calculateMonthlyCashFlow(income, expenses, financing)
  const unrealizedPL = calculateUnrealizedPL(valuation.currentValue, acquisition)
  const appreciationRate = calculateAppreciationRate(
    acquisition.purchasePrice,
    valuation.currentValue,
    acquisition.purchaseDate,
    valuation.valuationDate
  )
  
  const loanToValue = financing?.hasMortgage && financing.principal ? 
    calculateLTV(financing.principal, valuation.currentValue) : 0
  
  const annualDebtService = financing?.hasMortgage && financing.monthlyPayment ?
    financing.monthlyPayment * 12 : 0
  const dscr = annualDebtService > 0 ? calculateDSCR(noi, annualDebtService) : 0
  
  return {
    totalCostBasis,
    equity,
    noi,
    capRate,
    monthlyCashFlow,
    unrealizedPL,
    appreciationRate,
    loanToValue,
    dscr
  }
}
