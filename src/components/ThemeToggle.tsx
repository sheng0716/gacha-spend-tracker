import { useState } from 'react'
import { applyTheme, currentTheme, type Theme } from '../lib/theme'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme())

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <button
      className="btn icon theme-toggle"
      onClick={toggle}
      title={theme === 'dark' ? '切换到亮色' : '切换到暗色'}
      aria-label="切换主题"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
