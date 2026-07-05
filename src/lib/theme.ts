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

// antd 主题 token，数值直接对应 index.css 里 :root[data-theme] 的同名颜色，
// 让 antd 组件（按钮/卡片/表格等）跟项目自己的紫色系配色统一，而不是用 antd 默认蓝色+纯白。
export function antdTokens(t: Theme) {
  return t === 'dark'
    ? {
        colorPrimary: '#7c5cff',
        colorBgContainer: '#212121',
        colorBgElevated: '#272727',
        colorBorder: '#383838',
        colorText: '#f1f1f1',
        colorTextSecondary: '#aaaaaa',
        colorError: '#ff5c7a',
        colorSuccess: '#5ad19a',
        borderRadius: 12,
      }
    : {
        colorPrimary: '#8270ea',
        colorBgContainer: '#fbfaff',
        colorBgElevated: '#fbfaff',
        colorBorder: '#e8e5f1',
        colorText: '#353143',
        colorTextSecondary: '#847f96',
        colorError: '#d96079',
        colorSuccess: '#3a9e74',
        borderRadius: 12,
      }
}
