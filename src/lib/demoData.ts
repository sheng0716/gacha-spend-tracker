import type { Purchase } from '../types'
import { uuid } from './id'

// 仅用于 ?demo=1 预览界面，不写数据库
export const DEMO_PURCHASES: Purchase[] = [
  mk('2026-06-18', 'Star Savior', '30-Day Stellagem Supply', 'JPY', 800, 0.0303, 24.24, 'auto'),
  mk('2026-06-18', 'Stella Sora', '小月卡·盈月星願', 'TWD', 142, 0.1331, 18.9, 'manual'),
  mk('2026-05-29', 'Star Savior', "Scarlet's Super Package", 'JPY', 3500, 0.0301, 105.35, 'auto'),
  mk('2026-05-20', 'Stella Sora', '小月卡·盈月星願', 'TWD', 142, 0.1333, 18.93, 'auto'),
  mk('2026-04-18', 'Stella Sora', '大月卡·尊享補貼', 'TWD', 275, 0.1329, 36.55, 'auto'),
  mk('2026-03-21', 'Horizon Walker', '通行证', 'KRW', 2784, 0.0032, 8.91, 'auto'),
  mk('2026-01-30', 'Arknights: Endfield', 'Monthly Pass', 'JPY', 610, 0.0299, 18.24, 'auto'),
  mk('2025-12-19', 'Horizon Walker', '礼包', 'KRW', 10011, 0.0031, 31.03, 'auto'),
  mk('2025-11-20', 'Horizon Walker', '礼包', 'KRW', 2011, 0.0027, 5.43, 'manual'),
  mk('2025-11-06', 'Horizon Walker', '大礼包', 'KRW', 22335, 0.0027, 60.3, 'manual'),
  mk('2025-09-16', 'Horizon Walker', '超值礼包', 'KRW', 57162, 0.0027, 154.34, 'manual'),
]

function mk(
  order_date: string,
  game: string,
  product_name: string,
  currency: string,
  cost: number,
  rate: number,
  myr: number,
  rate_source: 'auto' | 'manual',
): Purchase {
  return {
    id: uuid(),
    user_id: 'demo',
    order_date,
    game,
    product_name,
    currency,
    cost,
    status: null,
    rate,
    rate_source,
    myr,
    note: null,
    created_at: new Date().toISOString(),
  }
}
