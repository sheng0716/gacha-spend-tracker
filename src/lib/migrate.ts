import type { Purchase } from '../types'
import { createGame, listGames } from './games'
import { createProduct, listProducts } from './products'

// 一次性把历史消费记录里出现过的游戏/商品导入到管理列表。
// 已存在同名的游戏/商品会跳过，所以可以重复点击不会重复导入。
export async function importGamesAndProductsFromPurchases(
  purchases: Purchase[],
): Promise<{ gamesCreated: number; productsCreated: number }> {
  const existingGames = await listGames()
  const existingProducts = await listProducts()
  const gameByName = new Map(existingGames.map((g) => [g.name, g]))
  const existingProductKeys = new Set(existingProducts.map((p) => `${p.game_id}::${p.name}`))

  let gamesCreated = 0
  let productsCreated = 0

  const byGame = new Map<string, Purchase[]>()
  for (const p of purchases) {
    const list = byGame.get(p.game) ?? []
    list.push(p)
    byGame.set(p.game, list)
  }

  for (const [gameName, gamePurchases] of byGame) {
    let game = gameByName.get(gameName)
    if (!game) {
      // 静态图标按游戏名在渲染时解析（resolveGameLogo/gameIcon），不存进 DB，
      // 免得把依赖部署位置的路径写死进数据；logo_url 只留给 Supabase 上传的自定义 logo。
      game = await createGame({ name: gameName, logo_url: null })
      gameByName.set(gameName, game)
      gamesCreated++
    }

    const byProduct = new Map<string, Purchase[]>()
    for (const p of gamePurchases) {
      const name = p.product_name?.trim()
      if (!name) continue
      const list = byProduct.get(name) ?? []
      list.push(p)
      byProduct.set(name, list)
    }

    for (const [productName, productPurchases] of byProduct) {
      const key = `${game.id}::${productName}`
      if (existingProductKeys.has(key)) continue

      const latest = [...productPurchases].sort((a, b) => {
        const byDate = b.order_date.localeCompare(a.order_date)
        return byDate !== 0 ? byDate : b.created_at.localeCompare(a.created_at)
      })[0]

      await createProduct({
        game_id: game.id,
        name: productName,
        currency: latest.currency,
        price: latest.cost,
      })
      existingProductKeys.add(key)
      productsCreated++
    }
  }

  return { gamesCreated, productsCreated }
}
