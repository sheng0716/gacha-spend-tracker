import { Layout, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Game, Product, Purchase } from '../types'
import GameAdmin from '../components/GameAdmin'
import ThemeToggle from '../components/ThemeToggle'

interface Props {
  userId: string
  games: Game[]
  products: Product[]
  purchases: Purchase[]
  onChanged: () => void
}

export default function AdminPage({ userId, games, products, purchases, onChanged }: Props) {
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Layout.Header className="topbar" style={{ height: 'auto', lineHeight: 'normal' }}>
        <Space size={4} align="center" className="brand">
          <Button type="text" icon={<ArrowLeftOutlined />} title="返回" onClick={() => navigate('/')} />
          游戏管理
        </Space>
        <Space size={8} align="center">
          <ThemeToggle />
        </Space>
      </Layout.Header>

      <Layout.Content>
        <div className="container">
          <GameAdmin
            userId={userId}
            games={games}
            products={products}
            purchases={purchases}
            onChanged={onChanged}
          />
        </div>
      </Layout.Content>
    </Layout>
  )
}
