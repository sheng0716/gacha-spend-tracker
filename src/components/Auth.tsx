import { useState } from 'react'
import { Alert, Button, Card, Form, Input, Segmented } from 'antd'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import ThemeToggle from './ThemeToggle'

type Mode = 'signin' | 'signup'

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signin')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function submit(values: { email: string; password: string }) {
    setErr(null)
    setMsg(null)
    if (!isSupabaseConfigured) {
      setErr('尚未配置 Supabase：请把 .env.example 复制为 .env.local 并填入 URL 与 anon key。')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp(values)
        if (error) throw error
        setMsg('注册成功！如果项目开启了邮箱验证，请去邮箱点确认链接后再登录。')
      } else {
        const { error } = await supabase.auth.signInWithPassword(values)
        if (error) throw error
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-toggle">
        <ThemeToggle />
      </div>
      <Card className="auth-card">
        <h1 className="brand">🎮 二游消费记录</h1>
        <p className="muted">记录你的抽卡/月卡花费，自动按当天汇率换算成 MYR。</p>

        <Segmented
          block
          value={mode}
          onChange={(v) => {
            setMode(v as Mode)
            setErr(null)
            setMsg(null)
          }}
          options={[
            { label: '登录', value: 'signin' },
            { label: '注册', value: 'signup' },
          ]}
          style={{ margin: '14px 0' }}
        />

        <Form layout="vertical" onFinish={submit} requiredMark={false}>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' },
            ]}
          >
            <Input type="email" name="email" autoComplete="email" placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password name="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </Form.Item>

          {err && <Alert type="error" showIcon message={err} style={{ marginBottom: 12 }} />}
          {msg && <Alert type="success" showIcon message={msg} style={{ marginBottom: 12 }} />}

          <Button type="primary" htmlType="submit" block loading={busy}>
            {mode === 'signin' ? '登录' : '注册'}
          </Button>
        </Form>

        {!isSupabaseConfigured && (
          <p className="muted small" style={{ marginTop: 12 }}>
            提示：当前未连接 Supabase，登录不可用。请先按 README 配置 .env.local。
          </p>
        )}
      </Card>
    </div>
  )
}
