import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  App as AntdApp,
  AutoComplete,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
} from 'antd'
import dayjs from 'dayjs'
import type { Game, Product, Purchase, PurchaseInput, RateSource } from '../types'
import { CURRENCIES, BASE_CURRENCY, formatMYR } from '../lib/currency'
import { getHistoricalRate } from '../lib/rates'
import { createPurchase, updatePurchase } from '../lib/purchases'
import { createProduct } from '../lib/products'
import { useComboFilter } from '../hooks/useComboFilter'
import GameAvatar from './GameAvatar'
import CurrencyFlag from './CurrencyFlag'

const STATUS_OPTIONS = ['', 'Ordered', 'Approved', 'Dispatched', 'Delivered']

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface Props {
  editing: Purchase | null
  games: Game[]
  products: Product[]
  onSaved: () => void
  onCancel: () => void
  // 表单是否被用户改动过（供父组件在关闭前决定是否提示放弃）
  onDirtyChange?: (dirty: boolean) => void
  // 演示模式：提供后用它代替直接写 Supabase
  onSaveOverride?: (input: PurchaseInput, editingId: string | null) => Promise<void>
  // 提供后，商品名称旁会出现「添加到商品库」按钮（演示模式没有商品库，不传即可）
  onProductAdded?: () => Promise<void>
}

export default function PurchaseForm({
  editing,
  games,
  products,
  onSaved,
  onCancel,
  onDirtyChange,
  onSaveOverride,
  onProductAdded,
}: Props) {
  const { message } = AntdApp.useApp()
  const [orderDate, setOrderDate] = useState(editing?.order_date ?? today())
  const [game, setGame] = useState(editing?.game ?? '')
  const [productName, setProductName] = useState(editing?.product_name ?? '')
  const [currency, setCurrency] = useState(editing?.currency ?? 'JPY')
  const [cost, setCost] = useState<string>(editing ? String(editing.cost) : '')
  const [status, setStatus] = useState(editing?.status ?? '')
  const [note, setNote] = useState(editing?.note ?? '')

  const [rate, setRate] = useState<number | null>(editing?.rate ?? null)
  const [rateSource, setRateSource] = useState<RateSource>(editing?.rate_source ?? 'auto')
  const [myr, setMyr] = useState<string>(editing ? String(editing.myr) : '')

  const [rateDate, setRateDate] = useState<string | null>(null)
  const [rateLoading, setRateLoading] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savingProduct, setSavingProduct] = useState(false)

  // 记录用户是否手动改动过表单（自动汇率等程序性更新不算）
  const [touched, setTouched] = useState(false)
  const markTouched = () => setTouched(true)
  useEffect(() => {
    onDirtyChange?.(touched)
  }, [touched, onDirtyChange])

  const costNum = parseFloat(cost)

  const selectedGame = useMemo(
    () => games.find((g) => g.name === game.trim()),
    [games, game],
  )
  const gameProducts = useMemo(
    () => (selectedGame ? products.filter((p) => p.game_id === selectedGame.id) : []),
    [products, selectedGame],
  )
  const productExists = useMemo(
    () => gameProducts.some((p) => p.name === productName.trim()),
    [gameProducts, productName],
  )
  const canAddProduct =
    !!onProductAdded && !!selectedGame && !!productName.trim() && !productExists

  async function addProductToDb() {
    if (!selectedGame) return
    if (isNaN(costNum) || costNum <= 0) {
      message.error('请先填写有效的原币金额，再添加到商品库。')
      return
    }
    setSavingProduct(true)
    try {
      await createProduct({
        game_id: selectedGame.id,
        name: productName.trim(),
        currency: currency.toUpperCase(),
        price: costNum,
      })
      message.success('已添加到商品库。')
      await onProductAdded?.()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      setSavingProduct(false)
    }
  }

  // 自动换算：order_date / currency / cost 变化且处于 auto 模式时，取历史汇率
  const debounceRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (rateSource !== 'auto') return
    if (!orderDate || !currency || !cost || isNaN(costNum)) return

    window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      setRateLoading(true)
      setRateError(null)
      try {
        const { rate: r, rateDate: rd } = await getHistoricalRate(currency, orderDate)
        setRate(r)
        setRateDate(rd)
        setMyr((costNum * r).toFixed(2))
      } catch (e) {
        setRateError(e instanceof Error ? e.message : String(e))
        setRate(null)
      } finally {
        setRateLoading(false)
      }
    }, 400)

    return () => window.clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderDate, currency, cost, rateSource])

  // 手动修改 MYR → 切到 manual，并反推 rate
  function onMyrChange(v: string) {
    markTouched()
    setMyr(v)
    setRateSource('manual')
    const m = parseFloat(v)
    if (!isNaN(m) && !isNaN(costNum) && costNum !== 0) {
      setRate(m / costNum)
    }
  }

  function revertToAuto() {
    markTouched()
    setRateSource('auto')
    setRateError(null)
    // effect 会自动重新换算
  }

  async function submit() {
    setSaveError(null)
    const myrNum = parseFloat(myr)
    if (isNaN(costNum) || costNum <= 0) {
      setSaveError('请填写有效的原币金额。')
      return
    }
    if (isNaN(myrNum)) {
      setSaveError('MYR 金额无效。可手动填写，或检查汇率是否取到。')
      return
    }
    const input: PurchaseInput = {
      order_date: orderDate,
      game: game.trim(),
      product_name: productName.trim() || null,
      currency: currency.toUpperCase(),
      cost: costNum,
      status: status || null,
      rate: rate,
      rate_source: rateSource,
      myr: myrNum,
      note: note.trim() || null,
    }
    setSaving(true)
    try {
      if (onSaveOverride) await onSaveOverride(input, editing?.id ?? null)
      else if (editing) await updatePurchase(editing.id, input)
      else await createPurchase(input)
      onSaved()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const isBase = currency.toUpperCase() === BASE_CURRENCY

  const gameFilter = useComboFilter(game)
  const productFilter = useComboFilter(productName)
  const currencyFilter = useComboFilter(currency)

  return (
    <Form className="form" layout="vertical" onFinish={submit} requiredMark={false}>
      <div className="grid2">
        <Form.Item label="下单日期" required>
          <DatePicker
            style={{ width: '100%' }}
            value={orderDate ? dayjs(orderDate) : null}
            onChange={(d) => {
              markTouched()
              setOrderDate(d ? d.format('YYYY-MM-DD') : '')
            }}
            allowClear={false}
          />
        </Form.Item>
        <Form.Item label="游戏" required>
          <div className="input-with-avatar">
            {game.trim() && <GameAvatar game={game} logoUrl={selectedGame?.logo_url} size={32} />}
            <AutoComplete
              style={{ flex: 1 }}
              value={game}
              onChange={(v) => {
                markTouched()
                setGame(v)
              }}
              placeholder="如 Star Savior"
              options={games.map((g) => ({
                value: g.name,
                label: (
                  <Space size={6}>
                    <GameAvatar game={g.name} logoUrl={g.logo_url} size={18} />
                    {g.name}
                  </Space>
                ),
              }))}
              {...gameFilter}
            />
          </div>
        </Form.Item>
      </div>

      <Form.Item label="商品名称">
        <AutoComplete
          style={{ width: '100%' }}
          value={productName}
          onChange={(v) => {
            markTouched()
            setProductName(v)
          }}
          onSelect={(v) => {
            const match = gameProducts.find((p) => p.name === v)
            if (match) {
              markTouched()
              setCurrency(match.currency.toUpperCase())
              setCost(String(match.price))
            }
          }}
          options={gameProducts.map((p) => ({ value: p.name }))}
          {...productFilter}
          placeholder="如 30-Day Stellagem Supply / 小月卡"
        />
        {canAddProduct && (
          <Button
            type="link"
            size="small"
            style={{ padding: '4px 0 0' }}
            loading={savingProduct}
            onClick={addProductToDb}
          >
            ＋ 添加到商品库（{selectedGame?.name}）
          </Button>
        )}
      </Form.Item>

      <div className="grid2">
        <Form.Item label="币种" required>
          <AutoComplete
            style={{ width: '100%' }}
            value={currency}
            onChange={(v) => {
              markTouched()
              setCurrency(v.toUpperCase())
            }}
            options={CURRENCIES.map((c) => ({ value: c, label: <CurrencyFlag code={c} /> }))}
            {...currencyFilter}
          />
        </Form.Item>
        <Form.Item label="原币金额" required>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            value={cost === '' ? null : Number(cost)}
            onChange={(v) => {
              markTouched()
              setCost(v == null ? '' : String(v))
            }}
            placeholder="如 800"
          />
        </Form.Item>
      </div>

      {/* 换算结果区 */}
      <div className="convert-box">
        <div className="convert-head">
          <span>换算成 MYR</span>
          <Tag color={rateSource === 'auto' ? 'blue' : 'orange'}>
            {rateSource === 'auto' ? '自动汇率' : '手动'}
          </Tag>
        </div>

        <div className="grid2">
          <Form.Item label="MYR 金额（可手动改成 Wise 实际扣款）">
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              value={myr === '' ? null : Number(myr)}
              onChange={(v) => onMyrChange(v == null ? '' : String(v))}
            />
          </Form.Item>
          <div className="rate-info">
            {isBase ? (
              <span className="muted small">基准货币，无需换算（1:1）。</span>
            ) : rateLoading ? (
              <span className="muted small">正在取 {orderDate} 的汇率…</span>
            ) : rate != null ? (
              <span className="muted small">
                汇率 1 {currency} ≈ {rate.toFixed(6)} MYR
                {rateDate && rateDate !== orderDate ? `（用 ${rateDate} 的汇率）` : ''}
                <br />
                {!isNaN(costNum) && `= ${formatMYR(costNum * rate)}`}
              </span>
            ) : (
              <span className="muted small">填好日期/币种/金额后自动换算。</span>
            )}
            {rateError && <Alert type="error" showIcon message={rateError} style={{ marginTop: 8 }} />}
            {rateSource === 'manual' && !isBase && (
              <Button type="link" size="small" style={{ padding: 0 }} onClick={revertToAuto}>
                ↻ 恢复自动汇率
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid2">
        <Form.Item label="状态（可选）">
          <Select
            style={{ width: '100%' }}
            value={status}
            onChange={(v) => {
              markTouched()
              setStatus(v)
            }}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s || '—' }))}
          />
        </Form.Item>
        <Form.Item label="备注（可选）">
          <Input
            value={note}
            onChange={(e) => {
              markTouched()
              setNote(e.target.value)
            }}
          />
        </Form.Item>
      </div>

      {saveError && <Alert type="error" showIcon message={saveError} style={{ marginBottom: 12 }} />}

      <div className="form-actions">
        <Button onClick={onCancel}>取消</Button>
        <Button type="primary" htmlType="submit" loading={saving}>
          {editing ? '保存修改' : '新增'}
        </Button>
      </div>
    </Form>
  )
}
