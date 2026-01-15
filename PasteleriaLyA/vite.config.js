import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'Sistema Pastelería LyA',
        short_name: 'LyA',
        description: 'Sistema de gestión para Pastelería y Cafetería LyA',
        theme_color: '#be185d',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait', // <--- AQUÍ ESTÁ EL CAMBIO (Antes decía 'landscape')
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
  }
})