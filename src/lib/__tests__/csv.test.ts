import { describe, it, expect } from 'vitest'
import { purchasesToCSV } from '../csv'
import type { Purchase } from '../../types'

function row(overrides: Partial<Purchase>): Purchase {
  return {
    id: 'id1',
    user_id: 'u1',
    order_date: '2025-01-02',
    game: 'Star Savior',
    product_name: '月卡',
    currency: 'JPY',
    cost: 800,
    status: null,
    rate: 0.032,
    rate_source: 'auto',
    myr: 25.6,
    note: null,
    created_at: '2025-01-02T00:00:00Z',
    ...overrides,
  }
}

describe('purchasesToCSV', () => {
  it('首行是表头', () => {
    const csv = purchasesToCSV([])
    expect(csv).toBe('order_date,game,product_name,currency,cost,status,rate,rate_source,myr,note')
  })

  it('null 字段导出为空串', () => {
    const csv = purchasesToCSV([row({ product_name: null, status: null, note: null })])
    const dataLine = csv.split('\n')[1]
    // product_name / status / note 三个 null 位置应为空
    expect(dataLine).toBe('2025-01-02,Star Savior,,JPY,800,,0.032,auto,25.6,')
  })

  it('含逗号/引号/换行的字段被正确转义', () => {
    const csv = purchasesToCSV([row({ note: 'a,b "c"\nd', product_name: 'x,y' })])
    const dataLine = csv.split('\n').slice(1).join('\n')
    expect(dataLine).toContain('"x,y"')
    expect(dataLine).toContain('"a,b ""c""\nd"') // 内部引号翻倍，整体加引号
  })

  it('多行按顺序输出', () => {
    const csv = purchasesToCSV([row({ game: 'A' }), row({ game: 'B' })])
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3) // 表头 + 2 行
    expect(lines[1]).toContain('A')
    expect(lines[2]).toContain('B')
  })
})
