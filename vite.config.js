import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/leki/' : '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      manifest: {
        name: 'Apteczka Karetki',
        short_name: 'Apteczka',
        description: 'Zarządzanie lekami w karetce pogotowia',
        theme_color: '#dc2626',
        background_color: '#1f2937',
        display: 'standalone',
        orientation: 'portrait',
        scope: process.env.NODE_ENV === 'production' ? '/leki/' : '/',
        start_url: process.env.NODE_ENV === 'production' ? '/leki/' : '/',
        icons: [
          {
            src: 'ambulance-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          },
          {
            src: 'ambulance-icon.svg',
            sizes: '72x72',
            type: 'image/svg+xml'
          },
          {
            src: 'ambulance-icon.svg',
            sizes: '96x96',
            type: 'image/svg+xml'
          },
          {
            src: 'ambulance-icon.svg',
            sizes: '128x128',
            type: 'image/svg+xml'
          },
          {
            src: 'ambulance-icon.svg',
            sizes: '144x144',
            type: 'image/svg+xml'
          },
          {
            src: 'ambulance-icon.svg',
            sizes: '152x152',
            type: 'image/svg+xml'
          },
          {
            src: 'ambulance-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'ambulance-icon.svg',
            sizes: '384x384',
            type: 'image/svg+xml'
          },
          {
            src: 'ambulance-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ]
})