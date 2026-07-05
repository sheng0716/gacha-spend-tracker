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

// 新增 / 编辑表单用的输入结构：从 Purchase 去掉数据库自动生成的字段派生，
// 这样给 purchases 表加列时只改 Purchase 一处即可。
export type PurchaseInput = Omit<Purchase, 'id' | 'user_id' | 'created_at'>

// 管理后台：目前在玩的游戏
export interface Game {
  id: string
  user_id: string
  name: string
  logo_url: string | null
  created_at: string
}

export type GameInput = Omit<Game, 'id' | 'user_id' | 'created_at'>

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

export type ProductInput = Omit<Product, 'id' | 'user_id' | 'created_at'>

// 用户设置：目前只有亮色模式自定义背景图
export interface Settings {
  user_id: string
  light_bg_url: string | null
  light_bg_position: number // 0-100，背景图垂直位置，50=居中
  updated_at: string
}
