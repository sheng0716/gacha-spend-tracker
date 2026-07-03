import { useMemo, useState } from 'react'
import { App as AntdApp, Button, Form, Input, Modal, Space, Upload } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Game, Product, Purchase } from '../types'
import { createGame, deleteGame, updateGame, uploadGameLogo } from '../lib/games'
import { importGamesAndProductsFromPurchases } from '../lib/migrate'
import GameAvatar from './GameAvatar'
import ProductAdmin from './ProductAdmin'

interface Props {
  userId: string
  games: Game[]
  products: Product[]
  purchases: Purchase[]
  onChanged: () => void
}

export default function GameAdmin({ userId, games, products, purchases, onChanged }: Props) {
  const { modal, message } = AntdApp.useApp()
  const [editing, setEditing] = useState<Game | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [search, setSearch] = useState('')
  const [managingGameId, setManagingGameId] = useState<string | null>(null)

  const filteredGames = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return games
    return games.filter((g) => g.name.toLowerCase().includes(q))
  }, [games, search])

  const managingGame = useMemo(
    () => (managingGameId ? games.find((g) => g.id === managingGameId) ?? null : null),
    [games, managingGameId],
  )

  function openNew() {
    setEditing(null)
    setName('')
    setFileList([])
    setShowForm(true)
  }

  function openEdit(g: Game) {
    setEditing(g)
    setName(g.name)
    setFileList(
      g.logo_url ? [{ uid: g.logo_url, name: 'logo', status: 'done', url: g.logo_url }] : [],
    )
    setShowForm(true)
  }

  async function submit() {
    if (!name.trim()) {
      message.error('请填写游戏名称。')
      return
    }
    setSaving(true)
    try {
      const game = editing ?? (await createGame({ name: name.trim(), logo_url: null }))
      const file = fileList[0]?.originFileObj
      let logoUrl = editing?.logo_url ?? null
      if (file) {
        logoUrl = await uploadGameLogo(userId, game.id, file)
      } else if (fileList.length === 0) {
        logoUrl = null
      }
      await updateGame(game.id, { name: name.trim(), logo_url: logoUrl })
      setShowForm(false)
      onChanged()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  function onDelete(g: Game) {
    modal.confirm({
      title: '删除这个游戏？',
      content: `${g.name}（不影响已有消费记录，只是从可选列表里移除）`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteGame(g.id)
          onChanged()
        } catch (e) {
          message.error(e instanceof Error ? e.message : String(e))
          return Promise.reject(e)
        }
      },
    })
  }

  async function runImport() {
    setImporting(true)
    try {
      const { gamesCreated, productsCreated } = await importGamesAndProductsFromPurchases(purchases)
      message.success(`导入完成：新增 ${gamesCreated} 个游戏、${productsCreated} 个商品。`)
      onChanged()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={runImport} loading={importing}>
          从历史记录导入
        </Button>
        <Button type="primary" onClick={openNew}>＋ 新增游戏</Button>
      </Space>

      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="搜索游戏"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 320 }}
      />

      <Modal
        title={editing ? '编辑游戏' : '新增游戏'}
        open={showForm}
        onCancel={() => setShowForm(false)}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={submit}>
          <Form.Item label="游戏名称" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如 Star Savior" />
          </Form.Item>
          <Form.Item label="Logo（可选）">
            <Upload
              listType="picture-card"
              maxCount={1}
              accept="image/*"
              fileList={fileList}
              beforeUpload={(file) => {
                if (!file.type.startsWith('image/')) {
                  message.error('只能上传图片文件')
                  return Upload.LIST_IGNORE
                }
                return false
              }}
              onChange={({ fileList: fl }) => setFileList(fl)}
            >
              {fileList.length === 0 && (
                <span>
                  <PlusOutlined /> 上传
                </span>
              )}
            </Upload>
          </Form.Item>
          <div className="form-actions">
            <Button onClick={() => setShowForm(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editing ? '保存修改' : '新增'}
            </Button>
          </div>
        </Form>
      </Modal>

      <div className="game-grid">
        {filteredGames.map((g) => (
          <div key={g.id} className="game-tile" onClick={() => setManagingGameId(g.id)}>
            <GameAvatar game={g.name} logoUrl={g.logo_url} size={56} />
            <span className="game-tile-name">{g.name}</span>
          </div>
        ))}
      </div>
      {filteredGames.length === 0 && <div className="muted small">没有匹配的游戏。</div>}

      <Modal
        title={
          managingGame ? (
            <span className="input-with-avatar">
              <GameAvatar game={managingGame.name} logoUrl={managingGame.logo_url} size={26} />
              {managingGame.name}
            </span>
          ) : null
        }
        open={!!managingGame}
        onCancel={() => setManagingGameId(null)}
        footer={null}
        destroyOnHidden
        width={720}
      >
        {managingGame && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Button icon={<EditOutlined />} onClick={() => openEdit(managingGame)}>
                编辑游戏
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(managingGame)}>
                删除游戏
              </Button>
            </Space>
            <ProductAdmin gameId={managingGame.id} products={products} onChanged={onChanged} />
          </>
        )}
      </Modal>
    </div>
  )
}
