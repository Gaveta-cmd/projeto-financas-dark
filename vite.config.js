import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Endereço da API Spring Boot em desenvolvimento; o front chama sempre /api.
const apiTarget = process.env.API_TARGET ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    // Permite abrir o app pelo celular na rede de casa (http://IP-do-PC:5173).
    host: true,
    proxy: {
      '/api': apiTarget,
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  preview: {
    host: true,
    proxy: {
      '/api': apiTarget,
    },
  },
})
