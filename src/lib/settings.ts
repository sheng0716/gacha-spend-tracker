import { supabase } from './supabase'
import { uuid } from './id'
import type { Settings } from '../types'

export async function getSettings(): Promise<Settings | null> {
  const { data, error } = await supabase.from('settings').select('*').maybeSingle()
  if (error) throw error
  return data as Settings | null
}

// 设置/清除背景图。换新图时把位置重置回居中（50），避免延用上一张图调好的裁剪位置。
export async function setLightBackground(userId: string, url: string | null): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .upsert({ user_id: userId, light_bg_url: url, light_bg_position: 50 })
    .select()
    .single()
  if (error) throw error
  return data as Settings
}

// 只调整已有背景图的垂直位置（拖动滑块时用），不动图片本身
export async function setBackgroundPosition(userId: string, position: number): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .upsert({ user_id: userId, light_bg_position: position })
    .select()
    .single()
  if (error) throw error
  return data as Settings
}

// 上传亮色模式背景图到 Storage，返回可直接用于 <img>/CSS background 的公开地址
export async function uploadBackground(userId: string, file: File): Promise<string> {
  const path = `${userId}/${uuid()}-${file.name}`
  const { error } = await supabase.storage.from('backgrounds').upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('backgrounds').getPublicUrl(path)
  return data.publicUrl
}

export interface BackgroundHistoryItem {
  path: string
  url: string
}

// 列出该用户在 Storage 里所有曾上传过的背景图（含已被替换掉、当前没在用的）
export async function listBackgroundHistory(userId: string): Promise<BackgroundHistoryItem[]> {
  const { data, error } = await supabase.storage
    .from('backgrounds')
    .list(userId, { sortBy: { column: 'created_at', order: 'desc' } })
  if (error) throw error
  return (data ?? [])
    .filter((f) => f.name) // 过滤掉文件夹占位对象
    .map((f) => {
      const path = `${userId}/${f.name}`
      return { path, url: supabase.storage.from('backgrounds').getPublicUrl(path).data.publicUrl }
    })
}

// 从 Storage 里彻底删除某张历史背景图
export async function deleteBackgroundFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from('backgrounds').remove([path])
  if (error) throw error
}
