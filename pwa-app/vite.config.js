import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/viajes/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      },
      manifest: {
        name: 'Registro de Viajes de Camiones',
        short_name: 'ViajesApp',
        description: 'Aplicación para registrar y sincronizar viajes de camiones.',
        theme_color: '#0000ff',
        background_color: '#ffffff',
        display: 'standalone',
        // icons should be relative to the base and normally live in public/
        icons: [
          { src: 'img/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'img/icons/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});