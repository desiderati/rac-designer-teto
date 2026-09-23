import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { vitePluginManusRuntime } from 'vite-plugin-manus-runtime';

const projectRoot = import.meta.dirname;
const appVersion = process.env.VITE_APP_VERSION ?? '5.1.1';
const buildTimestamp = process.env.VITE_BUILD_TIMESTAMP ?? new Date().toISOString();

export default defineConfig({
  root: path.resolve(projectRoot, 'client'),
  publicDir: path.resolve(projectRoot, 'client', 'public'),
  plugins: [react(), vitePluginManusRuntime()],
  envDir: projectRoot,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(buildTimestamp),
  },
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
