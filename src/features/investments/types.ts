export type InvestmentType = 
  | 'stock' 
  | 'etf' 
  | 'option' 
  | 'crypto' 
  | 'bond' 
  | 'commodity' 
  | 'real_estate' 
  | 'cash' 
  | 'custom'

export type OptionType = 'call' | 'put'
export type OptionAction = 'buy' | 'sell'
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'BTC' | 'ETH'

export interface Lot {
  id: string
  quantity: number
  price: number
  fees?: number
  date: string
  notes?: string
}

export interface BaseInvestment {
  id: string
  type: InvestmentType
  symbol: string
  displayName?: string
  account?: string
  tags?: string[]
  notes?: string
  privacy: {
    showPosition: boolean
    showLots: boolean
    showPnL: boolean
  }
  lots: Lot[]
  createdAt: string
  updatedAt: string
  
  // Computed values (calculated from lots + live prices)
  currentValue?: number
  unrealizedPnL?: number
  realizedPnL?: number
  todayChange?: number
  avgCost?: number
  totalQuantity?: number
}

export interface StockInvestment extends BaseInvestment {
  type: 'stock'
  dividendReinvestment?: boolean
  watchlist?: boolean
}

export interface ETFInvestment extends BaseInvestment {
  type: 'etf'
  dividendReinvestment?: boolean
  expenseRatio?: number
}

export interface OptionInvestment extends BaseInvestment {
  type: 'option'
  optionType: OptionType
  action: OptionAction
  strike: number
  expiration: string
  underlying: string
  contracts: number
  multiplier?: number
  assignmentHandling?: 'auto' | 'manual'
}

export interface CryptoInvestment extends BaseInvestment {
  type: 'crypto'
  currency: Currency
  network?: string
  stakingRewards?: boolean
}

export interface BondInvestment extends BaseInvestment {
  type: 'bond'
  issuer: string
  coupon: number
  maturity: string
  faceValue: number
  yieldToMaturity?: number
  creditRating?: string
}

export interface CommodityInvestment extends BaseInvestment {
  type: 'commodity'
  commodityType: string
  unit: string
  storageLocation?: string
  storageFees?: number
}

export interface RealEstateInvestment extends BaseInvestment {
  type: 'real_estate'
  propertyType: string
  address?: string
  purchasePrice: number
  equityPercentage: number
  mortgageBalance?: number
  monthlyRent?: number
  monthlyExpenses?: number
  capRate?: number
  valuationNotes?: string
}

export interface CashInvestment extends BaseInvestment {
  type: 'cash'
  currency: Currency
  interestRate?: number
  institution?: string
}

export interface CustomInvestment extends BaseInvestment {
  type: 'custom'
  category: string
  valueModel: 'manual' | 'lot_based'
  customFields?: Record<string, any>
  manualValue?: number
}

export type Investment = 
  | StockInvestment 
  | ETFInvestment 
  | OptionInvestment 
  | CryptoInvestment 
  | BondInvestment 
  | CommodityInvestment 
  | RealEstateInvestment 
  | CashInvestment 
  | CustomInvestment

export interface InvestmentFilters {
  types: InvestmentType[]
  tags: string[]
  accounts: string[]
  showWatchlistOnly: boolean
  showGainersOnly: boolean
  showLosersOnly: boolean
}

export interface InvestmentDraft {
  id?: string
  type: InvestmentType
  step: number
  data: Partial<Investment>
  lastSaved: string
}

export interface CsvImportMapping {
  symbol: string
  quantity: string
  price: string
  date: string
  fees?: string
  notes?: string
}

export interface CsvImportPreview {
  headers: string[]
  rows: string[][]
  mapping: CsvImportMapping
  valid: boolean
  errors: string[]
}

// P&L Calculation Types
export interface PositionMetrics {
  totalQuantity: number
  avgCost: number
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  realizedPnL: number
  totalReturn: number
  totalReturnPercent: number
  todayChange: number
  todayChangePercent: number
  costBasis: number
}

export interface LotMetrics {
  id: string
  quantity: number
  price: number
  fees: number
  date: string
  currentValue: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
}

// Option-specific types
export interface OptionBreakeven {
  breakeven: number
  maxProfit: number | null // null for unlimited
  maxLoss: number
  probability?: number
}

// Real Estate specific types
export interface RealEstateMetrics {
  currentEquity: number
  totalReturn: number
  annualizedReturn: number
  cashOnCashReturn: number
  netOperatingIncome: number
  capRate: number
}
