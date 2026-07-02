import { useSyncExternalStore } from 'react'
import { currentTheme, type Theme } from './theme'

// 监听 <html data-theme> 的变化，让 React 组件（如 antd ConfigProvider）
// 能跟着现有的 ThemeToggle 实时切换明暗，不用改动 ThemeToggle 本身。
function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
  return () => observer.disconnect()
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, currentTheme)
}
