import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Proxy API + product images to the FastAPI backend so the storefront works
// from a single origin during development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/media': 'http://127.0.0.1:8000',
    },
  },
})
