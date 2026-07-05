import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev we proxy API + uploaded files to the Express backend on :5000
// so the frontend can call relative "/api" and load "/uploads" images.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://sastitripswale-backend.onrender.com',
      '/uploads': 'https://sastitripswale-backend.onrender.com',
    },
  },
});
