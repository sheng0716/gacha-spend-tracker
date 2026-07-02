import { BASE_CURRENCY } from './currency'

// 历史中间汇率数据源：fawazahmed0 currency-api（免费、无 key、CDN、按天历史）
// 主源 jsDelivr，备源 Cloudflare Pages 镜像。
// 返回结构示例（base=twd）：{ "date": "2025-11-20", "twd": { "myr": 0.133, "jpy": ... } }

function dateUrls(date: string, base: string): string[] {
  const b = base.toLowerCase()
  return [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${b}.json`,
    `https://${date}.currency-api.pages.dev/v1/currencies/${b}.json`,
  ]
}

// 往前推 n 天（处理周末/数据缺失/未来日期）
function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

async function fetchOnDate(date: string, base: string): Promise<number | null> {
  const target = BASE_CURRENCY.toLowerCase()
  const b = base.toLowerCase()
  for (const url of dateUrls(date, base)) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const rate = data?.[b]?.[target]
      if (typeof rate === 'number' && rate > 0) return rate
    } catch {
      // 试下一个源
    }
  }
  return null
}

export interface RateResult {
  rate: number // 1 单位外币 = ? MYR
  rateDate: string // 实际取到汇率的日期（可能比下单日早几天）
}

/**
 * 取某币种在某下单日期的「→MYR 中间汇率」。
 * - MYR 直接返回 1
 * - 优先用下单当天，缺数据则向前回退最多 7 天
 * - 全部失败抛错，调用方应提示用户手动填写
 */
export async function getHistoricalRate(currency: string, orderDate: string): Promise<RateResult> {
  if (currency.toUpperCase() === BASE_CURRENCY) {
    return { rate: 1, rateDate: orderDate }
  }
  for (let i = 0; i <= 7; i++) {
    const date = shiftDate(orderDate, -i)
    const rate = await fetchOnDate(date, currency)
    if (rate != null) return { rate, rateDate: date }
  }
  throw new Error(`无法获取 ${currency} 在 ${orderDate} 的汇率，请手动填写 MYR 金额`)
}
