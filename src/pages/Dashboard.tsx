import { useMemo, useState } from 'react'
import { Alert, App as AntdApp, Button, Col, Layout, Modal, Row, Space, Spin } from 'antd'
import { SettingOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import type { Game, Product, Purchase, PurchaseInput } from '../types'
import { supabase } from '../lib/supabase'
import { deletePurchase } from '../lib/purchases'
import { downloadCSV } from '../lib/csv'
import { formatAmount, formatMYR } from '../lib/currency'
import { DEMO } from '../lib/demoMode'
import PurchaseForm from '../components/PurchaseForm'
import PurchaseList from '../components/PurchaseList'
import Summary from '../components/Summary'
import ThemeToggle from '../components/ThemeToggle'
import GameAvatar from '../components/GameAvatar'
import { gameLogoMap } from '../lib/games'

interface Props {
  session: Session | null
  purchases: Purchase[]
  games: Game[]
  products: Product[]
  loading: boolean
  loadError: string | null
  refresh: () => Promise<void>
  demoSave: (input: PurchaseInput, editingId: string | null) => Promise<void>
  demoDelete: (id: string) => void
}

export default function Dashboard({
  session,
  purchases,
  games,
  products,
  loading,
  loadError,
  refresh,
  demoSave,
  demoDelete,
}: Props) {
  const navigate = useNavigate()
  const { modal, message } = AntdApp.useApp()
  const logoByGame = useMemo(() => gameLogoMap(games), [games])

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Purchase | null>(null)
  const [formDirty, setFormDirty] = useState(false)

  function openNew() {
    setEditing(null)
    setFormDirty(false)
    setShowForm(true)
  }
  function openEdit(p: Purchase) {
    setEditing(p)
    setFormDirty(false)
    setShowForm(true)
  }
  function doCloseForm() {
    setShowForm(false)
    setEditing(null)
    setFormDirty(false)
  }
  // 关闭表单弹窗：有未保存改动时先确认，避免误关丢失
  function requestCloseForm() {
    if (!formDirty) {
      doCloseForm()
      return
    }
    modal.confirm({
      title: '放弃未保存的修改？',
      content: '表单里填写的内容尚未保存，关闭后会丢失。',
      okText: '放弃',
      okButtonProps: { danger: true },
      cancelText: '继续编辑',
      mask: { closable: true },
      onOk: () => doCloseForm(),
    })
  }
  function onSaved() {
    doCloseForm()
    refresh()
  }

  function onDelete(p: Purchase) {
    modal.confirm({
      title: '删除这笔记录？',
      content: (
        <div style={{ marginTop: 4 }}>
          <div className="input-with-avatar" style={{ marginBottom: 8 }}>
            <GameAvatar game={p.game} logoUrl={logoByGame.get(p.game)} size={32} />
            <div>
              <div style={{ fontWeight: 600 }}>{p.game}</div>
              <div className="muted small">{p.product_name || '—'}</div>
            </div>
          </div>
          <Space size={16}>
            <span className="muted small">{p.order_date}</span>
            <span className="muted small">
              {formatAmount(p.cost, p.currency)} ≈ {formatMYR(p.myr)}
            </span>
          </Space>
        </div>
      ),
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      mask: { closable: true }, // 点弹窗外的遮罩也能关闭
      onOk: async () => {
        try {
          if (DEMO) {
            demoDelete(p.id)
          } else {
            await deletePurchase(p.id)
            await refresh()
          }
        } catch (e) {
          message.error(e instanceof Error ? e.message : String(e))
          return Promise.reject(e) // 出错时保持弹窗打开
        }
      },
    })
  }

  function onLogout() {
    modal.confirm({
      title: '退出登录？',
      content: '退出后需要重新输入邮箱和密码登录。',
      okText: '退出',
      okButtonProps: { danger: true },
      cancelText: '取消',
      mask: { closable: true }, // 点弹窗外的遮罩也能关闭
      onOk: async () => {
        try {
          await supabase.auth.signOut()
        } catch (e) {
          message.error(e instanceof Error ? e.message : String(e))
          return Promise.reject(e)
        }
      },
    })
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Layout.Header className="topbar" style={{ height: 'auto', lineHeight: 'normal' }}>
        <div className="brand">🎮 二游消费记录</div>
        <Space size={8} align="center">
          <span className="muted small hide-mobile">{DEMO ? '演示模式' : session?.user.email}</span>
          <ThemeToggle />
          {!DEMO && (
            <Button icon={<SettingOutlined />} title="游戏管理" onClick={() => navigate('/admin')} />
          )}
          <Button onClick={() => downloadCSV(purchases)} disabled={!purchases.length}>
            导出 CSV
          </Button>
          {!DEMO && <Button onClick={onLogout}>退出</Button>}
        </Space>
      </Layout.Header>

      <Layout.Content>
        <div className="container">
          {loadError && <Alert type="error" showIcon message={loadError} style={{ marginBottom: 16 }} />}

          <div className="toolbar">
            <Button type="primary" onClick={openNew}>
              ＋ 新增记录
            </Button>
            {loading && <Spin size="small" />}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <PurchaseList purchases={purchases} games={games} onEdit={openEdit} onDelete={onDelete} />
            </Col>

            <Col xs={24} lg={8}>
              <Summary purchases={purchases} games={games} />
            </Col>
          </Row>
        </div>
      </Layout.Content>

      <Layout.Footer style={{ textAlign: 'center', background: 'transparent' }}>
        <span className="muted small">
          汇率为下单日中间汇率（fawazahmed0 currency-api），仅供估算；可逐笔改成 Wise 实际扣款额。
        </span>
      </Layout.Footer>

      <Modal
        title={editing ? '编辑记录' : '新增记录'}
        open={showForm}
        onCancel={requestCloseForm}
        footer={null}
        destroyOnHidden
        width={560}
      >
        <PurchaseForm
          key={editing?.id ?? 'new'}
          editing={editing}
          games={games}
          products={products}
          onSaved={onSaved}
          onDirtyChange={setFormDirty}
          onSaveOverride={DEMO ? demoSave : undefined}
          onProductAdded={DEMO ? undefined : refresh}
          onCancel={requestCloseForm}
        />
      </Modal>
    </Layout>
  )
}
