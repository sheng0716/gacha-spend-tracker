export type RateSource = 'auto' | 'manual'

export interface Purchase {
  id: string
  user_id: string
  order_date: string // YYYY-MM-DD
  game: string
  product_name: string | null
  currency: string
  cost: number
  status: string | null
  rate: number | null
  rate_source: RateSource
  myr: number
  note: string | null
  created_at: string
}

// 新增 / 编辑表单用的输入结构（不含数据库自动生成字段）
export interface PurchaseInput {
  order_date: string
  game: string
  product_name: string | null
  currency: string
  cost: number
  status: string | null
  rate: number | null
  rate_source: RateSource
  myr: number
  note: string | null
}

// 管理后台：目前在玩的游戏
export interface Game {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  created_at: string
}

export interface GameInput {
  name: string
  logo_url: string | null
}

// 管理后台：某个游戏下的商品（用于表单选择后自动带出币种/价格）
export interface Product {
  id: string
  user_id: string
  game_id: string
  name: string
  currency: string
  price: number
  created_at: string
}

export interface ProductInput {
  game_id: string
  name: string
  currency: string
  price: number
}
