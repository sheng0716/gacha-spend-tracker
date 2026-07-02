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
import type { Product } from '../types'
import { CURRENCIES, formatAmount } from '../lib/currency'
import { createProduct, deleteProduct, updateProduct } from '../lib/products'
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

  async function submit() {
    const priceNum = parseFloat(price)
    if (!name.trim() || isNaN(priceNum) || priceNum <= 0) {
      message.error('请填写商品名称和有效价格。')
      return
    }
    setSaving(true)
    try {
      const input = { game_id: gameId, name: name.trim(), currency: currency.toUpperCase(), price: priceNum }
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
      <Table
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={gameProducts}
        pagination={false}
        locale={{ emptyText: '暂无商品' }}
      />

      {showForm ? (
        <Form layout="vertical" style={{ marginTop: 12 }} onFinish={submit}>
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
                  filterOption={(input, option) =>
                    (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                  }
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
        <Button type="link" onClick={openNew} style={{ paddingLeft: 0 }}>
          ＋ 新增商品
        </Button>
      )}
    </div>
  )
}
