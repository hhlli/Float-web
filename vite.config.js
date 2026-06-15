import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    allowedHosts: ['.trycloudflare.com'], // 新增：允许所有 Cloudflare 临时子域名访问
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true // 开启 WebSocket 代理
      },
      '/agent': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true // 开启 WebSocket 代理
      }
    }
  }
})