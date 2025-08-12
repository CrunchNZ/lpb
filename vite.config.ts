import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/frontend/components'),
      '@/pages': path.resolve(__dirname, './src/frontend/pages'),
      '@/store': path.resolve(__dirname, './src/frontend/store'),
      '@/backend': path.resolve(__dirname, './src/backend'),
      '@/utils': path.resolve(__dirname, './src/backend/utils'),
      '@/strategies': path.resolve(__dirname, './src/backend/strategies'),
      '@/integrations': path.resolve(__dirname, './src/backend/integrations'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          solana: ['@solana/web3.js', '@solana/spl-token'],
          ui: ['@reduxjs/toolkit', 'react-redux'],
        },
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
}); 