import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for DevPrep
 * 
 * Concepts explained:
 * 1. plugins: Adds React Fast Refresh and JSX transformation support.
 * 2. server.port: Runs Vite dev server on port 5173.
 * 3. server.proxy: Directs any request starting with '/api' to 'http://localhost:5000'.
 *    This allows the frontend to call `fetch('/api/...')` without hardcoding backend URLs
 *    and prevents cross-origin (CORS) complications during local development.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
