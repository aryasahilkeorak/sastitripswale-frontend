import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The API base URL is driven by env (VITE_API_URL), NOT hardcoded here.
// This dev proxy only applies to `npm run dev`; in production (Vercel) the
// built app calls VITE_API_URL directly, so the proxy is irrelevant there.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DEV_PROXY || 'http://localhost:5000';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa/apple-touch-icon.png'],
        manifest: {
          name: 'SastiTripsWale — Travel Together',
          short_name: 'SastiTripsWale',
          description: "India's #1 travel community. Find travel mates, split expenses, explore India together.",
          theme_color: '#0a1220',
          background_color: '#0a1220',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/pwa/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        // App data is highly dynamic (trips, chat, payments) — precache only
        // the app shell/static assets, never API responses, so users always
        // see live data. No offline page for API routes.
        workbox: {
          navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        },
      }),
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': proxyTarget,
        '/uploads': proxyTarget,
      },
    },
  };
});
