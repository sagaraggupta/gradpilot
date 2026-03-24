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
      includeAssets: ['favicon.png', 'icon-512.png'], // Updated image name
      devOptions: {
        enabled: true // <--- THIS TURNS IT ON IN LOCALHOST!
      },
      manifest: {
        name: 'GradPilot',
        short_name: 'GradPilot',
        description: 'Your AI-powered academic assistant and productivity tracker.',
        theme_color: '#0d0d14', 
        background_color: '#0d0d14',
        display: 'standalone', 
        orientation: 'portrait',
        icons: [
          {
            src: 'icon-512.png', // Updated image name
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png', // Updated image name
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png', // Updated image name
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' 
          }
        ]
      }
    })
  ],
})