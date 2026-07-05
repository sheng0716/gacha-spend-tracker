import jpFlag from 'flag-icons/flags/4x3/jp.svg'
import twFlag from 'flag-icons/flags/4x3/tw.svg'
import krFlag from 'flag-icons/flags/4x3/kr.svg'
import myFlag from 'flag-icons/flags/4x3/my.svg'
import usFlag from 'flag-icons/flags/4x3/us.svg'
import cnFlag from 'flag-icons/flags/4x3/cn.svg'
import hkFlag from 'flag-icons/flags/4x3/hk.svg'
import sgFlag from 'flag-icons/flags/4x3/sg.svg'
import euFlag from 'flag-icons/flags/4x3/eu.svg'

// 基准货币：马币
export const BASE_CURRENCY = 'MYR'

// 下拉里常用的币种（用户主要是这几个，其余可手动输入）
export const CURRENCIES = ['JPY', 'TWD', 'KRW', 'MYR', 'USD', 'CNY', 'HKD', 'SGD', 'EUR'] as const

// 货币显示符号
const SYMBOLS: Record<string, string> = {
  JPY: '¥',
  TWD: 'NT$',
  KRW: '₩',
  MYR: 'RM',
  USD: '$',
  CNY: '¥',
  HKD: 'HK$',
  SGD: 'S$',
  EUR: '€',
}

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? code
}

// 无小数位的货币（日元/韩元没有「分」这种子单位，800 就是 800，不存在 800.5）
const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW'])

// 某币种原币金额应保留的小数位：无小数货币为 0，其余 2 位
export function currencyPrecision(code: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(code.toUpperCase()) ? 0 : 2
}

// 币种对应旗帜图标（本地打包，来自 flag-icons，不依赖联网）
const FLAGS: Record<string, string> = {
  JPY: jpFlag,
  TWD: twFlag,
  KRW: krFlag,
  MYR: myFlag,
  USD: usFlag,
  CNY: cnFlag,
  HKD: hkFlag,
  SGD: sgFlag,
  EUR: euFlag,
}

export function currencyFlagUrl(code: string): string | undefined {
  return FLAGS[code.toUpperCase()]
}

// 原币金额展示，如 "¥800"、"NT$142"
export function formatAmount(amount: number, currency: string): string {
  const n = amount.toLocaleString('en-US', { maximumFractionDigits: currencyPrecision(currency) })
  return `${currencySymbol(currency)}${n}`
}

// MYR 金额展示，固定两位小数，如 "RM 24.50"
export function formatMYR(amount: number): string {
  return `RM ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
