// crypto.randomUUID() 只在「安全上下文」可用（https 或 localhost）。
// 用自定义域名（如 buybuy.local）走 http 访问时它是 undefined，
// 直接调用会抛错。这里做个兜底，保证非安全上下文也能生成 id。
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // 退化实现：非加密强度，但本地用途（demo 数据 / 本地 state）足够
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
