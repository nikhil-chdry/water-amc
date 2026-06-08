import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name:             'Water AMC System',
        short_name:       'Water AMC',
        description:      'Water Solutions Business Management',
        theme_color:      '#3b82f6',
        background_color: '#030712',
        display:          'standalone',
        start_url:        '/',
        icons: [
          {
            src:     '/icons/icon-192x192.png',
            sizes:   '192x192',
            type:    'image/png',
            purpose: 'any maskable',
          },
          {
            src:     '/icons/icon-512x512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'any maskable',
          },
        ],
      },
   workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
  navigateFallback: null,
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: /^http:\/\/localhost:5000\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
      },
    },
  ],
},
    }),
  ],
});