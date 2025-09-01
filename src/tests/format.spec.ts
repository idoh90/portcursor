import { describe, it, expect } from 'vitest'
import { formatCurrency, formatPercent, formatCompactNumber } from '../lib/format'

describe('format', () => {
  it('formats currency safely', () => {
    expect(formatCurrency(1234.56, 'USD')).toMatch(/\$\s?1,234\.56|1,234\.56\s?\$/)
    expect(formatCurrency(NaN as any, 'USD')).toBeTypeOf('string')
  })
  it('formats percent with sign', () => {
    expect(formatPercent(1.234)).toBe('+1.23%')
    expect(formatPercent(-0.4)).toBe('-0.40%')
  })
  it('formats compact numbers', () => {
    expect(formatCompactNumber(12_300)).toMatch(/12\.3K|12K/)
  })
})


