import { useMemo, useState, type ClipboardEvent } from 'react'
import { App as AntdApp, Button, Form, Input, Modal, Radio, Space, Upload } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { Game, Product, Purchase } from '../types'
import { createGame, deleteGame, updateGame, uploadGameLogo, deleteGameLogoIfUploaded } from '../lib/games'
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

type ImportRange = 'all' | '1m' | '3m' | '6m'

const IMPORT_RANGE_MONTHS: Record<Exclude<ImportRange, 'all'>, number> = {
  '1m': 1,
  '3m': 3,
  '6m': 6,
}

function cutoffDate(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

export default function GameAdmin({ userId, games, products, purchases, onChanged }: Props) {
  const { modal, message } = AntdApp.useApp()
  const [editing, setEditing] = useState<Game | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importRange, setImportRange] = useState<ImportRange>('1m')
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
      const oldLogo = editing?.logo_url ?? null
      const file = fileList[0]?.originFileObj
      let logoUrl = oldLogo
      if (file) {
        logoUrl = await uploadGameLogo(userId, game.id, file)
      } else if (fileList.length === 0) {
        logoUrl = null
      }
      await updateGame(game.id, { name: name.trim(), logo_url: logoUrl })
      // logo 变了（换新图或清空），把旧的 Storage 文件清掉，免得成孤儿文件
      if (oldLogo && oldLogo !== logoUrl) await deleteGameLogoIfUploaded(oldLogo)
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
          await deleteGameLogoIfUploaded(g.logo_url) // 连同它的 logo 一起从 Storage 清掉
          onChanged()
        } catch (e) {
          message.error(e instanceof Error ? e.message : String(e))
          return Promise.reject(e)
        }
      },
    })
  }

  async function doImport() {
    setImporting(true)
    try {
      const scoped =
        importRange === 'all'
          ? purchases
          : purchases.filter((p) => p.order_date >= cutoffDate(IMPORT_RANGE_MONTHS[importRange]))
      const { gamesCreated, productsCreated } = await importGamesAndProductsFromPurchases(scoped)
      message.success(`导入完成：新增 ${gamesCreated} 个游戏、${productsCreated} 个商品。`)
      setImportModalOpen(false)
      onChanged()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      setImporting(false)
    }
  }

  function runImport() {
    setImportRange('1m')
    setImportModalOpen(true)
  }

  // 从剪贴板粘贴图片当 logo：支持「右键复制图片」「截图」等。
  // 剪贴板里的图片是 Blob，包成 antd UploadFile（带 originFileObj 供提交上传、thumbUrl 供预览）。
  function handlePasteLogo(e: ClipboardEvent) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith('image/'))
    if (!item) return
    const blob = item.getAsFile()
    if (!blob) return
    e.preventDefault()
    const ext = blob.type.split('/')[1] || 'png'
    const file = new File([blob], `pasted-logo.${ext}`, { type: blob.type })
    const uploadFile: UploadFile = {
      uid: `paste-${Date.now()}`,
      name: file.name,
      status: 'done',
      originFileObj: file as UploadFile['originFileObj'],
      thumbUrl: URL.createObjectURL(file),
    }
    setFileList([uploadFile])
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Space>
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
          style={{ maxWidth: 320 }}
        />
      </div>

      <Modal
        title="从历史记录导入？"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        onOk={doImport}
        okText="导入"
        cancelText="取消"
        confirmLoading={importing}
        maskClosable
      >
        <p>会根据消费记录里出现过的游戏和商品名称，自动新增缺失的游戏与商品。</p>
        <Radio.Group
          value={importRange}
          onChange={(e) => setImportRange(e.target.value)}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <Radio value="all">全部记录</Radio>
          <Radio value="1m">最近一个月</Radio>
          <Radio value="3m">最近三个月</Radio>
          <Radio value="6m">最近半年</Radio>
        </Radio.Group>
      </Modal>

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
          <Form.Item
            label="Logo（可选）"
            help="可直接从谷歌右键复制图片，然后点下方方框粘贴（Ctrl/⌘+V）；也可以点击上传文件。"
          >
            {/* tabIndex 让方框可聚焦，聚焦后 Ctrl/⌘+V 粘贴的图片会被 onPaste 捕获 */}
            <div tabIndex={0} onPaste={handlePasteLogo} style={{ outline: 'none', display: 'inline-block' }}>
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
                    <PlusOutlined /> 上传/粘贴
                  </span>
                )}
              </Upload>
            </div>
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
