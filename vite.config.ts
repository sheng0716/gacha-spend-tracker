import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,               // 允许用自定义域名访问
    port: 5173,               // 固定端口
    strictPort: true,         // 端口被占用就报错，不会偷偷换端口
    allowedHosts: ['buybuy.local'],
  },
})
