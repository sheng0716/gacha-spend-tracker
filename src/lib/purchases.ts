import { supabase } from './supabase'
import type { Purchase, PurchaseInput } from '../types'

export async function listPurchases(): Promise<Purchase[]> {
  const { data, error } = await supabase
    .from('purchases')
    .select('*')
    .order('order_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Purchase[]
}

export async function createPurchase(input: PurchaseInput): Promise<Purchase> {
  // user_id 由数据库 default auth.uid() 自动填充
  const { data, error } = await supabase.from('purchases').insert(input).select().single()
  if (error) throw error
  return data as Purchase
}

export async function updatePurchase(id: string, input: PurchaseInput): Promise<Purchase> {
  const { data, error } = await supabase
    .from('purchases')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Purchase
}

export async function deletePurchase(id: string): Promise<void> {
  const { error } = await supabase.from('purchases').delete().eq('id', id)
  if (error) throw error
}
