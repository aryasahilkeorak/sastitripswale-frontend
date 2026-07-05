import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The API base URL is driven by env (VITE_API_URL), NOT hardcoded here.
// This dev proxy only applies to `npm run dev`; in production (Vercel) the
// built app calls VITE_API_URL directly, so the proxy is irrelevant there.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DEV_PROXY || 'http://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': proxyTarget,
        '/uploads': proxyTarget,
      },
    },
  };
});
