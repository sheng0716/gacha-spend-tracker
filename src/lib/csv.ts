import type { Purchase } from '../types'

const HEADERS = [
  'order_date',
  'game',
  'product_name',
  'currency',
  'cost',
  'status',
  'rate',
  'rate_source',
  'myr',
  'note',
]

function escape(v: unknown): string {
  if (v == null) return ''
  const s = String(v)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function purchasesToCSV(purchases: Purchase[]): string {
  const lines = [HEADERS.join(',')]
  for (const p of purchases) {
    lines.push(
      [
        p.order_date,
        p.game,
        p.product_name,
        p.currency,
        p.cost,
        p.status,
        p.rate,
        p.rate_source,
        p.myr,
        p.note,
      ]
        .map(escape)
        .join(','),
    )
  }
  return lines.join('\n')
}

export function downloadCSV(purchases: Purchase[]) {
  // 加 BOM 让 Excel 正确识别 UTF-8（中文/¥ 不乱码）
  const blob = new Blob(['﻿' + purchasesToCSV(purchases)], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `purchases-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
