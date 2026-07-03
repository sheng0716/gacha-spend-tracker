import { useState } from 'react'
import { Layout, Button, Modal, Space } from 'antd'
import { ArrowLeftOutlined, PictureOutlined } from '@ant-design/icons'
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
  const [showBackground, setShowBackground] = useState(false)

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Layout.Header className="topbar" style={{ height: 'auto', lineHeight: 'normal' }}>
        <Space size={4} align="center" className="brand">
          <Button type="text" icon={<ArrowLeftOutlined />} title="返回" onClick={() => navigate('/')} />
          游戏管理
        </Space>
        <Space size={8} align="center">
          <Button icon={<PictureOutlined />} onClick={() => setShowBackground(true)}>
            背景设置
          </Button>
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

      <Modal
        title="亮色模式背景"
        open={showBackground}
        onCancel={() => setShowBackground(false)}
        footer={null}
        destroyOnHidden
        width={720}
      >
        <BackgroundAdmin
          userId={userId}
          lightBgUrl={settings?.light_bg_url ?? null}
          lightBgPosition={settings?.light_bg_position ?? 50}
          onChanged={onSettingsChanged}
        />
      </Modal>
    </Layout>
  )
}
