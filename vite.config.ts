import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.split('\\').join('/');

          if (!normalizedId.includes('/node_modules/')) {
            return undefined;
          }

          if (normalizedId.includes('/echarts/')) {
            return 'echarts';
          }

          if (
            normalizedId.includes('/react/') ||
            normalizedId.includes('/react-dom/') ||
            normalizedId.includes('/react-router/') ||
            normalizedId.includes('/react-router-dom/') ||
            normalizedId.includes('/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (
            normalizedId.includes('/@tanstack/react-query/') ||
            normalizedId.includes('/zustand/')
          ) {
            return 'state-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
