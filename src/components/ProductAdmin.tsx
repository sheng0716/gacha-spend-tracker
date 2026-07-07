import { useMemo, useState } from 'react'
import {
  App as AntdApp,
  AutoComplete,
  Button,
  Form,
  Input,
  InputNumber,
  Space,
  Table,
  type TableColumnsType,
} from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import type { Product, ProductInput } from '../types'
import { CURRENCIES, formatAmount } from '../lib/currency'
import { createProduct, deleteProduct, updateProduct } from '../lib/products'
import { useComboFilter } from '../hooks/useComboFilter'
import CurrencyFlag from './CurrencyFlag'

interface Props {
  gameId: string
  products: Product[]
  onChanged: () => void
}

export default function ProductAdmin({ gameId, products, onChanged }: Props) {
  const { modal, message } = AntdApp.useApp()
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('JPY')
  const [price, setPrice] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const gameProducts = useMemo(
    () => products.filter((p) => p.game_id === gameId),
    [products, gameId],
  )
  const currencyFilter = useComboFilter(currency)

  function openNew() {
    setEditing(null)
    setName('')
    setCurrency('JPY')
    setPrice('')
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setName(p.name)
    setCurrency(p.currency)
    setPrice(String(p.price))
    setShowForm(true)
  }

  async function persist(input: ProductInput) {
    setSaving(true)
    try {
      if (editing) await updateProduct(editing.id, input)
      else await createProduct(input)
      setShowForm(false)
      onChanged()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  function submit() {
    const priceNum = parseFloat(price)
    if (!name.trim() || isNaN(priceNum) || priceNum <= 0) {
      message.error('请填写商品名称和有效价格。')
      return
    }
    const input = { game_id: gameId, name: name.trim(), currency: currency.toUpperCase(), price: priceNum }
    // 编辑时若资料真的变了，先弹确认再覆盖旧记录，防手滑；没变化或新增则直接写入
    const changed =
      editing != null &&
      (input.name !== editing.name || input.currency !== editing.currency || input.price !== editing.price)
    if (changed) {
      const rows: { label: string; from: string; to: string }[] = []
      if (input.name !== editing!.name) rows.push({ label: '名称', from: editing!.name, to: input.name })
      if (input.currency !== editing!.currency)
        rows.push({ label: '币种', from: editing!.currency, to: input.currency })
      if (input.price !== editing!.price)
        rows.push({
          label: '价格',
          from: formatAmount(editing!.price, editing!.currency),
          to: formatAmount(input.price, input.currency),
        })
      modal.confirm({
        title: '用新资料替换旧的？',
        content: (
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', marginTop: 8 }}>
            {rows.map((r) => (
              <div key={r.label} style={{ display: 'contents' }}>
                <span className="muted">{r.label}</span>
                <span>
                  <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{r.from}</span>
                  {' → '}
                  <strong>{r.to}</strong>
                </span>
              </div>
            ))}
          </div>
        ),
        okText: '替换',
        cancelText: '取消',
        onOk: () => persist(input),
      })
      return
    }
    void persist(input)
  }

  function onDelete(p: Product) {
    modal.confirm({
      title: '删除这个商品？',
      content: `${p.name}（不影响已有消费记录）`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteProduct(p.id)
          onChanged()
        } catch (e) {
          message.error(e instanceof Error ? e.message : String(e))
          return Promise.reject(e)
        }
      },
    })
  }

  const columns: TableColumnsType<Product> = [
    {
      title: '商品名称',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '币种',
      dataIndex: 'currency',
      render: (_, p) => <CurrencyFlag code={p.currency} />,
      sorter: (a, b) => a.currency.localeCompare(b.currency),
    },
    {
      title: '价格',
      dataIndex: 'price',
      align: 'right',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.price - b.price,
      render: (_, p) => formatAmount(p.price, p.currency),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, p) => (
        <Space size={0}>
          <Button
            type="text"
            size="small"
            title="编辑"
            icon={<EditOutlined />}
            onClick={() => openEdit(p)}
          />
          <Button
            type="text"
            size="small"
            title="删除"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(p)}
          />
        </Space>
      ),
    },
  ]

  return (
    <div>
      {showForm ? (
        <Form layout="vertical" style={{ marginBottom: 12 }} onFinish={submit}>
          <div className="grid2">
            <Form.Item label="商品名称" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如小月卡" />
            </Form.Item>
            <Form.Item label="价格" required>
              <Space.Compact style={{ width: '100%' }}>
                <AutoComplete
                  style={{ width: '35%' }}
                  value={currency}
                  onChange={(v) => setCurrency(v.toUpperCase())}
                  options={CURRENCIES.map((c) => ({ value: c, label: <CurrencyFlag code={c} /> }))}
                  {...currencyFilter}
                />
                <InputNumber
                  style={{ width: '65%' }}
                  min={0}
                  value={price === '' ? null : Number(price)}
                  onChange={(v) => setPrice(v == null ? '' : String(v))}
                  placeholder="如 800"
                />
              </Space.Compact>
            </Form.Item>
          </div>
          <div className="form-actions">
            <Button onClick={() => setShowForm(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {editing ? '保存修改' : '新增'}
            </Button>
          </div>
        </Form>
      ) : (
        <Button type="primary" onClick={openNew} style={{ marginBottom: 8 }}>
          ＋ 新增商品
        </Button>
      )}

      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={gameProducts}
        pagination={false}
        locale={{ emptyText: '暂无商品' }}
      />
    </div>
  )
}
