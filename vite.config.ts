import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/gacha-spend-tracker/', // GitHub Pages 部署在子路径下，资源引用要加这个前缀
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 把体积大且不常变的第三方库拆成独立 chunk：并行下载 + 长期缓存，
        // 业务代码改动时这些 vendor chunk 的 hash 不变，用户不用重新下载。
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (/[\\/]node_modules[\\/](antd|@ant-design|rc-|@rc-component)/.test(id)) return 'antd'
          if (/[\\/]node_modules[\\/](recharts|d3-|victory-|internmap)/.test(id)) return 'charts'
          if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return 'supabase'
        },
      },
    },
  },
  server: {
    host: true,               // 允许用自定义域名访问
    port: 5173,               // 固定端口
    strictPort: true,         // 端口被占用就报错，不会偷偷换端口
    allowedHosts: ['buybuy.local'],
  },
})
