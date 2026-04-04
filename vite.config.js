import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // 👈 MAGIC FIX 1: Auto-injects the service worker
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}']
      },

      devOptions: {
        enabled: true, // 👈 MAGIC FIX 2: Turn this to TRUE to test locally!
        type: 'module'
      },

      manifest: {
        name: 'GradPilot',
        short_name: 'GradPilot',
        description: 'Gamified student productivity dashboard',
        theme_color: '#0d0d14',
        background_color: '#0d0d14',
        display: 'standalone',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
})