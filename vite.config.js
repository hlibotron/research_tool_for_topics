import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_TARGET || 'http://127.0.0.1:8765';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': apiTarget,
      '/file': apiTarget,
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'vendor-react-dom';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('/react/')) return 'vendor-react';
            return 'vendor';
          }
        },
      },
    },
  },
});
