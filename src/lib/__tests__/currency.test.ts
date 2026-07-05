import { describe, it, expect } from 'vitest'
import { currencyPrecision, formatAmount, formatMYR, currencySymbol } from '../currency'

describe('currencyPrecision', () => {
  it('无小数货币（JPY/KRW）精度为 0', () => {
    expect(currencyPrecision('JPY')).toBe(0)
    expect(currencyPrecision('KRW')).toBe(0)
    expect(currencyPrecision('jpy')).toBe(0) // 大小写不敏感
  })

  it('其余货币精度为 2', () => {
    expect(currencyPrecision('MYR')).toBe(2)
    expect(currencyPrecision('USD')).toBe(2)
    expect(currencyPrecision('TWD')).toBe(2)
  })
})

describe('formatAmount', () => {
  it('JPY 不带小数', () => {
    expect(formatAmount(800, 'JPY')).toBe('¥800')
    expect(formatAmount(1234, 'JPY')).toBe('¥1,234')
  })

  it('带小数货币保留最多两位', () => {
    expect(formatAmount(24.5, 'USD')).toBe('$24.5')
    expect(formatAmount(1000, 'MYR')).toBe('RM1,000')
  })

  it('未知币种回退用原 code 作符号', () => {
    expect(formatAmount(10, 'XYZ')).toBe('XYZ10')
  })
})

describe('formatMYR', () => {
  it('固定两位小数 + 千分位', () => {
    expect(formatMYR(24.5)).toBe('RM 24.50')
    expect(formatMYR(1234.5)).toBe('RM 1,234.50')
    expect(formatMYR(0)).toBe('RM 0.00')
  })
})

describe('currencySymbol', () => {
  it('已知币种返回符号，未知返回原样', () => {
    expect(currencySymbol('MYR')).toBe('RM')
    expect(currencySymbol('EUR')).toBe('€')
    expect(currencySymbol('ABC')).toBe('ABC')
  })
})
