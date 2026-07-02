import { useCallback, useEffect, useState } from 'react'
import { Spin } from 'antd'
import { Navigate, Route, Routes } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import type { Game, Product, Purchase, PurchaseInput } from './types'
import { listPurchases } from './lib/purchases'
import { listGames } from './lib/games'
import { listProducts } from './lib/products'
import { DEMO_PURCHASES } from './lib/demoData'
import { uuid } from './lib/id'
import { DEMO } from './lib/demoMode'
import Auth from './components/Auth'
import Dashboard from './pages/Dashboard'
import AdminPage from './pages/AdminPage'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // 会话初始化与监听
  useEffect(() => {
    if (DEMO) {
      setPurchases(DEMO_PURCHASES)
      setAuthReady(true)
      return
    }
    if (!isSupabaseConfigured) {
      setAuthReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const refresh = useCallback(async () => {
    if (DEMO) return
    setLoading(true)
    setLoadError(null)
    try {
      const [p, g, pr] = await Promise.all([listPurchases(), listGames(), listProducts()])
      setPurchases(p)
      setGames(g)
      setProducts(pr)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshGamesAndProducts = useCallback(async () => {
    const [g, pr] = await Promise.all([listGames(), listProducts()])
    setGames(g)
    setProducts(pr)
  }, [])

  useEffect(() => {
    if (DEMO) return
    if (session) refresh()
    else setPurchases([])
  }, [session, refresh])

  // 演示模式：增改删只操作本地 state
  async function demoSave(input: PurchaseInput, editingId: string | null) {
    setPurchases((prev) => {
      if (editingId) return prev.map((p) => (p.id === editingId ? { ...p, ...input } : p))
      const row: Purchase = {
        ...input,
        id: uuid(),
        user_id: 'demo',
        created_at: new Date().toISOString(),
      }
      return [row, ...prev]
    })
  }

  function demoDelete(id: string) {
    setPurchases((prev) => prev.filter((x) => x.id !== id))
  }

  if (!authReady)
    return (
      <div className="center">
        <Spin size="large" />
      </div>
    )

  if (!session && !DEMO) return <Auth />

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Dashboard
            session={session}
            purchases={purchases}
            games={games}
            products={products}
            loading={loading}
            loadError={loadError}
            refresh={refresh}
            demoSave={demoSave}
            demoDelete={demoDelete}
          />
        }
      />
      {!DEMO && (
        <Route
          path="/admin"
          element={
            <AdminPage
              userId={session?.user.id ?? ''}
              games={games}
              products={products}
              purchases={purchases}
              onChanged={refreshGamesAndProducts}
            />
          }
        />
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
