import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getHistoricalRate } from '../rates'

// 内存版 localStorage，隔离每个用例
function installLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  })
  return store
}

// 让 fetch 对指定 date+currency 返回给定汇率；其余一律 404（模拟当天暂无数据）
function mockFetchRates(available: Record<string, number>) {
  return vi.fn(async (url: string) => {
    // url 形如 .../@2025-01-02/v1/currencies/jpy.json 或 https://2025-01-02.currency-api...
    const m = url.match(/(\d{4}-\d{2}-\d{2})[^\d].*currencies\/([a-z]+)\.json/)
    if (!m) return { ok: false, status: 404 } as Response
    const [, date, base] = m
    const key = `${date}:${base}`
    if (key in available) {
      return {
        ok: true,
        json: async () => ({ [base]: { myr: available[key] } }),
      } as unknown as Response
    }
    return { ok: false, status: 404 } as Response
  })
}

describe('getHistoricalRate', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = installLocalStorage()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('MYR→MYR 直接返回 1，不发网络', async () => {
    const fetchSpy = vi.stubGlobal('fetch', vi.fn())
    const res = await getHistoricalRate('MYR', '2025-01-02')
    expect(res).toEqual({ rate: 1, rateDate: '2025-01-02' })
    expect(fetchSpy).toBeDefined()
  })

  it('取当天汇率并写入缓存', async () => {
    const fetch = mockFetchRates({ '2025-01-02:jpy': 0.032 })
    vi.stubGlobal('fetch', fetch)
    const res = await getHistoricalRate('JPY', '2025-01-02')
    expect(res.rate).toBe(0.032)
    expect(res.rateDate).toBe('2025-01-02')
    // 缓存已写入
    expect(store.get('rate:2025-01-02:jpy:myr')).toBe('0.032')
  })

  it('命中缓存时完全跳过网络', async () => {
    store.set('rate:2025-01-02:jpy:myr', '0.05')
    const fetch = mockFetchRates({})
    vi.stubGlobal('fetch', fetch)
    const res = await getHistoricalRate('JPY', '2025-01-02')
    expect(res.rate).toBe(0.05)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('当天无数据时向前回退到最近有数据的一天', async () => {
    // 下单日 01-04 无数据，01-02 有（回退 2 天）
    const fetch = mockFetchRates({ '2025-01-02:jpy': 0.031 })
    vi.stubGlobal('fetch', fetch)
    const res = await getHistoricalRate('JPY', '2025-01-04')
    expect(res.rate).toBe(0.031)
    expect(res.rateDate).toBe('2025-01-02')
  })

  it('回退 7 天仍无数据则抛错', async () => {
    const fetch = mockFetchRates({})
    vi.stubGlobal('fetch', fetch)
    await expect(getHistoricalRate('JPY', '2025-01-04')).rejects.toThrow(/无法获取/)
  })
})
