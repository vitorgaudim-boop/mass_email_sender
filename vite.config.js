import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'renderer'),
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173
  },
  build: {
    outDir: path.resolve(__dirname, 'dist', 'renderer'),
    emptyOutDir: true
  },
  test: {
    environment: 'jsdom',
    setupFiles: path.resolve(__dirname, 'test', 'setup.js'),
    include: ['../test/**/*.{test,spec}.js']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer', 'src')
    }
  }
});
