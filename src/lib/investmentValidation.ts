import { z } from 'zod'
import { 
  stockFormSchema,
  etfFormSchema,
  optionFormSchema,
  cryptoFormSchema,
  bondFormSchema,
  commodityFormSchema,
  realEstateFormSchema,
  cashFormSchema,
  customFormSchema
} from '../schemas/investments'
import type { InvestmentType } from '../features/investments/types'

const FORM_SCHEMAS = {
  stock: stockFormSchema,
  etf: etfFormSchema,
  option: optionFormSchema,
  crypto: cryptoFormSchema,
  bond: bondFormSchema,
  commodity: commodityFormSchema,
  real_estate: realEstateFormSchema,
  cash: cashFormSchema,
  custom: customFormSchema,
}

export function validateInvestmentData(
  type: InvestmentType,
  data: any,
  // step: 'basic' | 'details' | 'lots' = 'basic'
): { isValid: boolean; errors: Record<string, string> } {
  const schema = FORM_SCHEMAS[type]
  if (!schema) {
    return { isValid: false, errors: { type: 'Invalid investment type' } }
  }

  try {
    // For partial validation during form steps, we'll try to validate what we have
    schema.parse(data)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach(err => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { isValid: false, errors }
    }
    
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

export function validateRequiredFields(
  type: InvestmentType,
  data: any,
  step: 'basic' | 'details' | 'lots'
): string[] {
  const requiredFields: Record<InvestmentType, Record<string, string[]>> = {
    stock: {
      basic: ['symbol'],
      details: ['entryMethod'],
      lots: ['quantity', 'price', 'date']
    },
    etf: {
      basic: ['symbol'],
      details: ['entryMethod'],
      lots: ['quantity', 'price', 'date']
    },
    option: {
      basic: ['underlying', 'optionType', 'action'],
      details: ['strike', 'expiration', 'contracts'],
      lots: ['premium', 'date']
    },
    crypto: {
      basic: ['currency'],
      details: ['entryMethod'],
      lots: ['quantity', 'price', 'date']
    },
    bond: {
      basic: ['issuer', 'bondType'],
      details: ['coupon', 'maturity', 'faceValue'],
      lots: ['quantity', 'purchasePrice', 'date']
    },
    commodity: {
      basic: ['commodityType', 'unit'],
      details: [],
      lots: ['quantity', 'price', 'date']
    },
    real_estate: {
      basic: ['displayName', 'propertyType'],
      details: ['purchasePrice', 'downPayment'],
      lots: ['purchaseDate']
    },
    cash: {
      basic: ['displayName', 'currency'],
      details: [],
      lots: ['balance']
    },
    custom: {
      basic: ['displayName', 'category'],
      details: ['valueModel'],
      lots: []
    }
  }

  const required = requiredFields[type]?.[step] || []
  return required.filter(field => !data[field] || data[field] === '')
}

export function getValidationMessage(
  type: InvestmentType,
  field: string,
  value: any
): string | null {
  // Custom validation messages for specific fields
  const validationRules: Record<string, (value: any) => string | null> = {
    symbol: (value) => {
      if (!value) return 'Symbol is required'
      if (typeof value !== 'string') return 'Symbol must be text'
      if (value.length > 10) return 'Symbol too long (max 10 characters)'
      if (!/^[A-Z0-9\.\-]+$/i.test(value)) return 'Invalid symbol format'
      return null
    },
    
    quantity: (value) => {
      if (!value) return 'Quantity is required'
      const num = parseFloat(value)
      if (isNaN(num)) return 'Quantity must be a number'
      if (num <= 0) return 'Quantity must be positive'
      return null
    },
    
    price: (value) => {
      if (!value) return 'Price is required'
      const num = parseFloat(value)
      if (isNaN(num)) return 'Price must be a number'
      if (num < 0) return 'Price cannot be negative'
      return null
    },
    
    strike: (value) => {
      if (!value) return 'Strike price is required'
      const num = parseFloat(value)
      if (isNaN(num)) return 'Strike price must be a number'
      if (num <= 0) return 'Strike price must be positive'
      if (num > 10000) return 'Strike price seems unreasonably high'
      return null
    },
    
    expiration: (value) => {
      if (!value) return 'Expiration date is required'
      const date = new Date(value)
      if (isNaN(date.getTime())) return 'Invalid date format'
      if (date <= new Date()) return 'Expiration date must be in the future'
      return null
    },
    
    date: (value) => {
      if (!value) return 'Date is required'
      const date = new Date(value)
      if (isNaN(date.getTime())) return 'Invalid date format'
      if (date > new Date()) return 'Date cannot be in the future'
      return null
    },
    
    coupon: (value) => {
      if (value === undefined || value === '') return null // Optional field
      const num = parseFloat(value)
      if (isNaN(num)) return 'Coupon rate must be a number'
      if (num < 0) return 'Coupon rate cannot be negative'
      if (num > 50) return 'Coupon rate seems unreasonably high'
      return null
    },
    
    fees: (value) => {
      if (value === undefined || value === '') return null // Optional field
      const num = parseFloat(value)
      if (isNaN(num)) return 'Fees must be a number'
      if (num < 0) return 'Fees cannot be negative'
      return null
    },
    
    interestRate: (value) => {
      if (value === undefined || value === '') return null // Optional field
      const num = parseFloat(value)
      if (isNaN(num)) return 'Interest rate must be a number'
      if (num < 0) return 'Interest rate cannot be negative'
      if (num > 50) return 'Interest rate seems unreasonably high'
      return null
    }
  }

  const validator = validationRules[field]
  return validator ? validator(value) : null
}

export function validateLotData(lot: any): Record<string, string> {
  const errors: Record<string, string> = {}
  
  const quantityError = getValidationMessage('stock', 'quantity', lot.quantity)
  if (quantityError) errors.quantity = quantityError
  
  const priceError = getValidationMessage('stock', 'price', lot.price)
  if (priceError) errors.price = priceError
  
  const dateError = getValidationMessage('stock', 'date', lot.date)
  if (dateError) errors.date = dateError
  
  const feesError = getValidationMessage('stock', 'fees', lot.fees)
  if (feesError) errors.fees = feesError
  
  return errors
}

export function validateOptionData(data: any): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!data.underlying) errors.underlying = 'Underlying symbol is required'
  if (!data.optionType) errors.optionType = 'Option type is required'
  if (!data.action) errors.action = 'Action is required'
  
  const strikeError = getValidationMessage('option', 'strike', data.strike)
  if (strikeError) errors.strike = strikeError
  
  const expirationError = getValidationMessage('option', 'expiration', data.expiration)
  if (expirationError) errors.expiration = expirationError
  
  if (!data.contracts || parseInt(data.contracts) <= 0) {
    errors.contracts = 'Number of contracts must be positive'
  }
  
  if (!data.premium || parseFloat(data.premium) < 0) {
    errors.premium = 'Premium cannot be negative'
  }
  
  return errors
}

export function validateRealEstateData(data: any): Record<string, string> {
  const errors: Record<string, string> = {}
  
  if (!data.displayName) errors.displayName = 'Property name is required'
  if (!data.propertyType) errors.propertyType = 'Property type is required'
  
  if (!data.purchasePrice || parseFloat(data.purchasePrice) <= 0) {
    errors.purchasePrice = 'Purchase price must be positive'
  }
  
  if (!data.downPayment || parseFloat(data.downPayment) < 0) {
    errors.downPayment = 'Down payment cannot be negative'
  }
  
  if (data.purchasePrice && data.downPayment && 
      parseFloat(data.downPayment) > parseFloat(data.purchasePrice)) {
    errors.downPayment = 'Down payment cannot exceed purchase price'
  }
  
  if (data.monthlyRent && parseFloat(data.monthlyRent) < 0) {
    errors.monthlyRent = 'Monthly rent cannot be negative'
  }
  
  if (data.monthlyExpenses && parseFloat(data.monthlyExpenses) < 0) {
    errors.monthlyExpenses = 'Monthly expenses cannot be negative'
  }
  
  return errors
}
