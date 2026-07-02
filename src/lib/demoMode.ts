// 演示模式：URL 带 ?demo=1 时用本地假数据，不连 Supabase
export const DEMO = new URLSearchParams(window.location.search).has('demo')
