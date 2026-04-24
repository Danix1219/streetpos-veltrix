import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza solo si hay nueva versión
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Cachea todos los archivos visuales
      },
      manifest: {
        name: 'StreetPOS',
        short_name: 'StreetPOS',
        description: 'Punto de Venta Inteligente',
        theme_color: '#2563EB',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'LogoPerfil.jpeg', // Cambia por tus íconos en formato PNG/WebP
            sizes: '192x192',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ]
});