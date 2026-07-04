import { useMemo } from 'react'
import { Avatar, Card, Col, Row, Space, Statistic, Tooltip as AntdTooltip } from 'antd'
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
  Rectangle,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { Game, Purchase } from '../types'
import { formatMYR } from '../lib/currency'
import { gameColor, gameInitial, resolveGameLogo, gameLogoMap } from '../lib/games'

const COLORS = ['#7c5cff', '#ff7ab6', '#39c0ed', '#ffc14d', '#5ad19a', '#ff8a65', '#a78bfa']

interface Props {
  purchases: Purchase[]
  games: Game[]
}

// 饼图切片外围的头像标签：有 logo 就裁成圆形贴图，没有就画色块首字母（跟 GameAvatar 兜底逻辑一致）
// 用 antd Tooltip 包一层，鼠标停在头像上显示跟全站风格一致的悬浮提示（比浏览器原生 title 好看）
function renderPieAvatarLabel(logoByGame: Map<string, string | null>) {
  return (props: {
    cx: number
    cy: number
    midAngle?: number
    outerRadius: number
    index: number
    name?: string | number
  }) => {
    const { cx, cy, midAngle = 0, outerRadius, index, name = '' } = props
    const gameName = String(name)
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 18
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    // 跟 GameAvatar 一样过一遍 resolveGameLogo：DB 里存的静态图标路径要按 BASE_URL 重拼，不然子路径部署会 404
    const logo = resolveGameLogo(logoByGame.get(gameName), gameName)
    const size = 22

    const avatar = logo ? (
      (() => {
        const clipId = `pie-avatar-clip-${index}`
        return (
          <g>
            <defs>
              <clipPath id={clipId}>
                <circle cx={x} cy={y} r={size / 2} />
              </clipPath>
            </defs>
            <image
              href={logo}
              x={x - size / 2}
              y={y - size / 2}
              width={size}
              height={size}
              clipPath={`url(#${clipId})`}
              preserveAspectRatio="xMidYMid slice"
            />
          </g>
        )
      })()
    ) : (
      <g>
        <circle cx={x} cy={y} r={size / 2} fill={gameColor(gameName)} />
        <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#fff">
          {gameInitial(gameName)}
        </text>
      </g>
    )

    return (
      <AntdTooltip key={`pie-avatar-${index}`} title={gameName}>
        {avatar}
      </AntdTooltip>
    )
  }
}

// 堆叠柱状图每段画出本段颜色 + 段中间的百分比文字（占当月总花费的比例），段太窄（<8%）就不画字，免得文字挤成一团。
// 用 Bar 的 shape 而不是 label 来画：recharts 给 label 的 index 是「过滤掉 0 高度段之后」重新排过的下标，
// 某个月这个游戏没花钱时会把后面月份的下标全部错位；shape 直接拿到这一段自己的 payload（原始行数据），不会错位。
function renderStackedGameBar(name: string, monthTotals: Map<string, number>, roundTop: boolean) {
  return (props: {
    x?: number
    y?: number
    width?: number
    height?: number
    fill?: string
    payload?: Record<string, number | string>
  }) => {
    const { x = 0, y = 0, width = 0, height = 0, fill, payload = {} } = props
    const value = Number(payload[name]) || 0
    const total = monthTotals.get(String(payload.month)) ?? 0
    const percent = total ? (value / total) * 100 : 0
    return (
      <g>
        <Rectangle x={x} y={y} width={width} height={height} fill={fill} radius={roundTop ? [4, 4, 0, 0] : undefined} />
        {percent >= 8 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fill="#fff"
          >
            {percent.toFixed(0)}%
          </text>
        )}
      </g>
    )
  }
}

export default function Summary({ purchases, games }: Props) {
  const logoByGame = useMemo(() => gameLogoMap(games), [games])
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
    const m = new Map<string, Record<string, number>>()
    for (const p of purchases) {
      const ym = p.order_date.slice(0, 7)
      const row = m.get(ym) ?? {}
      row[p.game] = (row[p.game] ?? 0) + Number(p.myr)
      m.set(ym, row)
    }
    return Array.from(m, ([month, games]) => ({
      month,
      ...Object.fromEntries(Object.entries(games).map(([g, v]) => [g, Number(v.toFixed(2))])),
    }) as Record<string, number | string>).sort((a, b) =>
      String(a.month).localeCompare(String(b.month)),
    )
  }, [purchases])

  // 保持跟「各游戏占比」饼图一致的游戏顺序（花费高的排前面，堆叠时也在底部）
  const gameNames = useMemo(() => byGame.map((g) => g.name), [byGame])

  const monthTotals = useMemo(() => {
    const m = new Map<string, number>()
    for (const row of byMonth) {
      m.set(String(row.month), gameNames.reduce((s, g) => s + (Number(row[g]) || 0), 0))
    }
    return m
  }, [byMonth, gameNames])

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
              <ResponsiveContainer width="100%" height={300}>
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
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {gameNames.map((name, i) => (
                    <Bar
                      key={name}
                      dataKey={name}
                      stackId="month"
                      fill={gameColor(name)}
                      shape={renderStackedGameBar(name, monthTotals, i === gameNames.length - 1)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="各游戏占比 (MYR)">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byGame}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    label={renderPieAvatarLabel(logoByGame)}
                    labelLine={{ stroke: 'var(--border)' }}
                  >
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
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}
