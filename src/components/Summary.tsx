import { useMemo } from 'react'
import { Avatar, Card, Col, Row, Space, Statistic } from 'antd'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import type { Purchase } from '../types'
import { formatMYR } from '../lib/currency'

const COLORS = ['#7c5cff', '#ff7ab6', '#39c0ed', '#ffc14d', '#5ad19a', '#ff8a65', '#a78bfa']

interface Props {
  purchases: Purchase[]
}

export default function Summary({ purchases }: Props) {
  const total = useMemo(() => purchases.reduce((s, p) => s + Number(p.myr), 0), [purchases])

  const thisMonthTotal = useMemo(() => {
    const ym = new Date().toISOString().slice(0, 7)
    return purchases
      .filter((p) => p.order_date.slice(0, 7) === ym)
      .reduce((s, p) => s + Number(p.myr), 0)
  }, [purchases])

  const lastMonthTotal = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    const ym = d.toISOString().slice(0, 7)
    return purchases
      .filter((p) => p.order_date.slice(0, 7) === ym)
      .reduce((s, p) => s + Number(p.myr), 0)
  }, [purchases])

  // 上个月没有花费的话没法算百分比，此时不显示环比
  const momPercent = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null

  const byGame = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of purchases) m.set(p.game, (m.get(p.game) ?? 0) + Number(p.myr))
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [purchases])

  const byMonth = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of purchases) {
      const ym = p.order_date.slice(0, 7)
      m.set(ym, (m.get(ym) ?? 0) + Number(p.myr))
    }
    return Array.from(m, ([month, value]) => ({ month, value: Number(value.toFixed(2)) })).sort(
      (a, b) => a.month.localeCompare(b.month),
    )
  }, [purchases])

  return (
    <div className="summary">
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={24}>
          <Card>
            <Statistic
              title={
                <Space size={8}>
                  <Avatar size={24} icon={<WalletOutlined />} style={{ background: '#3b82f6' }} />
                  总花费
                </Space>
              }
              value={formatMYR(total)}
            />
          </Card>
        </Col>
        <Col xs={12} lg={24}>
          <Card>
            <Statistic
              title={
                <Space size={8}>
                  <Avatar size={24} icon={<CalendarOutlined />} style={{ background: '#a855f7' }} />
                  本月花费
                </Space>
              }
              value={formatMYR(thisMonthTotal)}
            />
            {momPercent != null && (
              <div className={`muted small mom-trend ${momPercent >= 0 ? 'up' : 'down'}`}>
                {momPercent >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
                {Math.abs(momPercent).toFixed(0)}% 较上月
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={24}>
          <Card>
            <Statistic
              title={
                <Space size={8}>
                  <Avatar size={24} icon={<UnorderedListOutlined />} style={{ background: '#14b8a6' }} />
                  总笔数
                </Space>
              }
              value={purchases.length}
            />
          </Card>
        </Col>
      </Row>

      {purchases.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="按月花费 (MYR)">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byMonth} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip
                    cursor={{ fill: 'var(--panel-2)' }}
                    formatter={(v) => formatMYR(Number(v))}
                    contentStyle={{
                      background: 'var(--panel)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text)',
                    }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="各游戏占比 (MYR)">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={byGame} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {byGame.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatMYR(Number(v))}
                    contentStyle={{
                      background: 'var(--panel)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      color: 'var(--text)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}
