import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// 没配 .env.local 时给出明确提示，而不是后面莫名其妙报错
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] 缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，' +
      '请复制 .env.example 为 .env.local 并填入 Supabase 项目的 URL 与 anon key。',
  )
}

// 即使未配置也创建一个客户端（用占位值），避免 import 阶段崩溃；
// 真正调用时若未配置会在 UI 层拦截。
export const supabase = createClient(
  url ?? 'http://localhost:54321',
  anonKey ?? 'public-anon-key-placeholder',
)
