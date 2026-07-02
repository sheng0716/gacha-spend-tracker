import { Layout, Button, Space } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Game, Product, Purchase, Settings } from '../types'
import BackgroundAdmin from '../components/BackgroundAdmin'
import GameAdmin from '../components/GameAdmin'
import ThemeToggle from '../components/ThemeToggle'

interface Props {
  userId: string
  games: Game[]
  products: Product[]
  purchases: Purchase[]
  settings: Settings | null
  onChanged: () => void
  onSettingsChanged: () => void
}

export default function AdminPage({
  userId,
  games,
  products,
  purchases,
  settings,
  onChanged,
  onSettingsChanged,
}: Props) {
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
          <BackgroundAdmin
            userId={userId}
            lightBgUrl={settings?.light_bg_url ?? null}
            lightBgPosition={settings?.light_bg_position ?? 50}
            onChanged={onSettingsChanged}
          />
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
