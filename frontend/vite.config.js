import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Build çıktısı: public_html klasörüne gidecek dosyalar
  build: {
    outDir: '../public/frontend-build',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://Projeler.test',
        changeOrigin: true,
        rewrite: (path) => '/finans-kalesi/public' + path,
      },
    },
  },
})
