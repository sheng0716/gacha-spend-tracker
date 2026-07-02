import { useEffect } from 'react'

interface Props {
  lightBgUrl: string | null
  lightBgPosition: number
}

// 挂在 App 顶层：有自定义背景图时，给 <html> 加 has-custom-bg 类 + 设置 --custom-bg / --custom-bg-position 变量。
// 具体是否显示（只在亮色模式）交给 index.css 里的选择器判断，这里不需要关心当前主题。
export default function CustomBackground({ lightBgUrl, lightBgPosition }: Props) {
  useEffect(() => {
    const root = document.documentElement
    if (lightBgUrl) {
      root.style.setProperty('--custom-bg', `url("${lightBgUrl}")`)
      root.style.setProperty('--custom-bg-position', `${lightBgPosition}%`)
      root.classList.add('has-custom-bg')
    } else {
      root.classList.remove('has-custom-bg')
      root.style.removeProperty('--custom-bg')
      root.style.removeProperty('--custom-bg-position')
    }
    return () => {
      root.classList.remove('has-custom-bg')
      root.style.removeProperty('--custom-bg')
      root.style.removeProperty('--custom-bg-position')
    }
  }, [lightBgUrl, lightBgPosition])

  return null
}
