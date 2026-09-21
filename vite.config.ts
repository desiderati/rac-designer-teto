import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { vitePluginManusRuntime } from 'vite-plugin-manus-runtime';

const projectRoot = import.meta.dirname;
const gitVersion = (() => {
  try {
    return `dev+${execFileSync('git', ['rev-parse', '--short', 'HEAD'], {cwd: projectRoot}).toString().trim()}`;
  } catch {
    return null;
  }
})();
const appVersion = process.env.VITE_APP_VERSION ?? gitVersion ?? process.env.npm_package_version ?? 'dev';

export default defineConfig({
  root: path.resolve(projectRoot, 'client'),
  publicDir: path.resolve(projectRoot, 'client', 'public'),
  plugins: [react(), vitePluginManusRuntime()],
  envDir: projectRoot,
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
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
