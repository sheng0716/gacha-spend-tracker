import type { ReactNode } from 'react'
import { App as AntApp, ConfigProvider, theme as antdTheme } from 'antd'
import { useTheme } from '../lib/useTheme'
import { antdTokens } from '../lib/theme'

// 把 antd 的主题算法接到现有的明暗切换：dark → darkAlgorithm，light → defaultAlgorithm。
// 同时传入 token，让 antd 组件用项目自己的紫色系配色而不是 antd 默认蓝色+纯白卡片。
// 外层再套 antd 的 <App>，让 Modal.confirm / message 等能拿到主题上下文（否则会有告警且不跟随暗色）。
export default function AntdProvider({ children }: { children: ReactNode }) {
  const theme = useTheme()
  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: antdTokens(theme),
      }}
    >
      <AntApp>{children}</AntApp>
    </ConfigProvider>
  )
}
