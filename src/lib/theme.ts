export type Theme = 'light' | 'dark'

const KEY = 'theme'

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function getStoredTheme(): Theme | null {
  const t = localStorage.getItem(KEY)
  return t === 'light' || t === 'dark' ? t : null
}

// 页面初次加载时调用：有保存用保存的，否则跟随系统
export function initTheme(): void {
  const t = getStoredTheme() ?? systemTheme()
  document.documentElement.setAttribute('data-theme', t)
}

export function currentTheme(): Theme {
  return (document.documentElement.getAttribute('data-theme') as Theme) ?? systemTheme()
}

export function applyTheme(t: Theme): void {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem(KEY, t)
}
