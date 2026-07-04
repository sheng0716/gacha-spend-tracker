// GitHub Pages 没有服务器端路由重写，刷新 /some/route 会真去请求那个路径导致 404。
// 约定俗成的解法：把 404.html 也做成 index.html 的内容，GitHub Pages 找不到路径时会回退到它，
// 交给前端的 React Router 去接管显示对应页面。
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, '..', 'dist')

copyFileSync(join(dist, 'index.html'), join(dist, '404.html'))
