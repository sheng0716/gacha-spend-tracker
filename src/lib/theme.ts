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
        // Google Material 暗色配色（与 index.css 的 dark vars 对应）
        colorPrimary: '#8ab4f8',
        // Google 的浅蓝按钮用深色文字（白字在浅蓝上对比度不足）
        colorTextLightSolid: '#202124',
        colorBgContainer: '#292a2d',
        colorBgElevated: '#35363a',
        colorBorder: '#3c4043',
        colorText: '#e8eaed',
        colorTextSecondary: '#9aa0a6',
        colorError: '#f28b82',
        colorSuccess: '#81c995',
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
