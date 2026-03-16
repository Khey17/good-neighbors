import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, any request to /api/* gets forwarded to the backend
      // So the frontend never needs to know the backend's URL
      '/api': 'http://localhost:8000',
    },
  },
})
