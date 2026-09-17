import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react-swc';

const projectRoot = import.meta.dirname;

export default defineConfig({
  root: path.resolve(projectRoot, 'client'),
  publicDir: path.resolve(projectRoot, 'client', 'public'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'client', 'src'),
      '@shared': path.resolve(projectRoot, 'shared'),
    },
  },
  build: {
    outDir: path.resolve(projectRoot, 'dist', 'public'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return;
          if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
          if (id.includes('fabric')) return 'fabric-vendor';
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['../e2e/**', '**/node_modules/**', '**/dist/**'],
  },
});
