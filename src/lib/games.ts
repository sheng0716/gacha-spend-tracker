import { supabase } from './supabase'
import { uuid } from './id'
import type { Game, GameInput } from '../types'

export async function listGames(): Promise<Game[]> {
  const { data, error } = await supabase.from('games').select('*').order('name')
  if (error) throw error
  return (data ?? []) as Game[]
}

export async function createGame(input: GameInput): Promise<Game> {
  const { data, error } = await supabase.from('games').insert(input).select().single()
  if (error) throw error
  return data as Game
}

export async function updateGame(id: string, input: GameInput): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Game
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', id)
  if (error) throw error
}

// 上传游戏 logo 到 Storage，返回可直接用于 <img src> 的公开地址
export async function uploadGameLogo(userId: string, gameId: string, file: File): Promise<string> {
  const path = `${userId}/${gameId}/${uuid()}-${file.name}`
  const { error } = await supabase.storage.from('game-logos').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('game-logos').getPublicUrl(path)
  return data.publicUrl
}

// 游戏名 → 头像图片路径。图片放在 public/games/ 下，这里登记映射。
// 这份静态映射只用于「从历史记录导入」时给老游戏带出已有的图片，
// 新游戏的 logo 走上面的 Storage 上传，存进 games.logo_url。
export const GAME_ICONS: Record<string, string> = {
  'Star Savior': '/games/star-savior.webp',
  'Stella Sora': '/games/stella-sora.webp',
  'Horizon Walker': '/games/horizon-walker.jpg',
  'Arknights: Endfield': '/games/arknights-endfield.webp',
}

export function gameIcon(name: string): string | null {
  return GAME_ICONS[name.trim()] ?? null
}

// 没有头像的游戏：根据名字算一个稳定的颜色，做首字母圆形头像
export function gameColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return `hsl(${h} 50% 55%)`
}

export function gameInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
