import { useMemo, useState } from 'react'
import { Button, Card, DatePicker, Select, Space, Table, Tag, type TableColumnsType } from 'antd'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type { Game, Purchase } from '../types'
import { formatAmount, formatMYR } from '../lib/currency'
import GameAvatar from './GameAvatar'
import CurrencyFlag from './CurrencyFlag'

const { RangePicker } = DatePicker

interface Props {
  purchases: Purchase[]
  games: Game[]
  onEdit: (p: Purchase) => void
  onDelete: (p: Purchase) => void
}

export default function PurchaseList({ purchases, games, onEdit, onDelete }: Props) {
  const logoByGame = useMemo(
    () => new Map(games.map((g) => [g.name, g.logo_url])),
    [games],
  )
  const [gameFilter, setGameFilter] = useState<string>('')
  const [currencyFilter, setCurrencyFilter] = useState<string>('')
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ])

  const gameNames = useMemo(
    () => Array.from(new Set(purchases.map((p) => p.game))).sort(),
    [purchases],
  )
  const currencies = useMemo(
    () => Array.from(new Set(purchases.map((p) => p.currency))).sort(),
    [purchases],
  )

  const from = range?.[0] ? range[0].format('YYYY-MM-DD') : ''
  const to = range?.[1] ? range[1].format('YYYY-MM-DD') : ''

  const rows = useMemo(
    () =>
      purchases.filter((p) => {
        if (gameFilter && p.game !== gameFilter) return false
        if (currencyFilter && p.currency !== currencyFilter) return false
        if (from && p.order_date < from) return false
        if (to && p.order_date > to) return false
        return true
      }),
    [purchases, gameFilter, currencyFilter, from, to],
  )

  const filteredTotal = useMemo(() => rows.reduce((s, p) => s + Number(p.myr), 0), [rows])

  const hasFilter = Boolean(gameFilter || currencyFilter || from || to)

  function clearFilters() {
    setGameFilter('')
    setCurrencyFilter('')
    setRange(null)
  }

  const columns: TableColumnsType<Purchase> = [
    {
      title: '日期',
      dataIndex: 'order_date',
      sorter: (a, b) => a.order_date.localeCompare(b.order_date),
      defaultSortOrder: 'descend',
      render: (v: string) => <span style={{ whiteSpace: 'nowrap' }}>{v}</span>,
    },
    {
      title: '游戏',
      dataIndex: 'game',
      sorter: (a, b) => a.game.localeCompare(b.game),
      render: (_, p) => (
        <Space size={8}>
          <GameAvatar game={p.game} logoUrl={logoByGame.get(p.game)} size={26} />
          {p.game}
        </Space>
      ),
    },
    {
      title: '商品',
      dataIndex: 'product_name',
      render: (_, p) => (
        <div style={{ maxWidth: 260 }}>
          {p.product_name || <span className="muted">—</span>}
          {p.note && <div className="muted small">{p.note}</div>}
        </div>
      ),
    },
    {
      title: '原价',
      dataIndex: 'cost',
      sorter: (a, b) => a.cost - b.cost,
      render: (_, p) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          {formatAmount(Number(p.cost), p.currency)}
          <div className="muted small"><CurrencyFlag code={p.currency} /></div>
        </div>
      ),
    },
    {
      title: 'MYR',
      dataIndex: 'myr',
      align: 'right',
      sorter: (a, b) => a.myr - b.myr,
      render: (_, p) => (
        <span style={{ whiteSpace: 'nowrap' }}>
          {formatMYR(Number(p.myr))}
          {p.rate_source === 'manual' && <Tag style={{ marginInlineStart: 6 }}>手动</Tag>}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, p) => (
        <Space size={0}>
          <Button type="text" size="small" title="编辑" icon={<EditOutlined />} onClick={() => onEdit(p)} />
          <Button type="text" size="small" title="删除" danger icon={<DeleteOutlined />} onClick={() => onDelete(p)} />
        </Space>
      ),
    },
  ]

  return (
    <Card
      title="消费记录"
      extra={
        <span className="muted small">
          {rows.length} 笔 · 合计 {formatMYR(filteredTotal)}
        </span>
      }
    >
      <Space wrap style={{ marginBottom: 12 }}>
        <Select
          style={{ minWidth: 150 }}
          value={gameFilter || undefined}
          onChange={(v) => setGameFilter(v ?? '')}
          allowClear
          placeholder="全部游戏"
          options={gameNames.map((g) => ({ value: g, label: g }))}
        />
        <Select
          style={{ minWidth: 120 }}
          value={currencyFilter || undefined}
          onChange={(v) => setCurrencyFilter(v ?? '')}
          allowClear
          placeholder="全部币种"
          options={currencies.map((c) => ({ value: c, label: <CurrencyFlag code={c} /> }))}
        />
        <RangePicker
          value={range}
          onChange={(vals) => setRange(vals)}
          placeholder={['起始日期', '结束日期']}
          presets={[
            { label: '本月', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
            {
              // 基于当前已选的月份往前推一个月，而不是固定"今天所在月的上一月"
              // 这样连续点几次就能一路往回翻：本月→上个月→再上个月→...
              label: '上个月',
              value: () => {
                const prevMonth = (range?.[0] ?? dayjs()).subtract(1, 'month')
                return [prevMonth.startOf('month'), prevMonth.endOf('month')]
              },
            },
          ]}
        />
        {hasFilter && (
          <Button type="link" onClick={clearFilters}>
            清除筛选
          </Button>
        )}
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={false}
        size="middle"
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: '暂无记录' }}
      />
    </Card>
  )
}
