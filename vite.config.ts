import {defineConfig} from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(async ({mode}) => {
  const plugins = [];

  try {
    const {default: react} = await import('@vitejs/plugin-react-swc');
    plugins.push(react());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Some tooling evaluates this config through `[eval]`, which breaks createRequire(import.meta.url).
    if (!message.includes('Received \'[eval]\'') || !message.includes('file URL object')) {
      throw error;
    }
  }

  if (mode === 'development') {
    const {componentTagger} = await import('lovable-tagger');
    plugins.push(componentTagger());
  }

  return {
    server: {
      host: '::',
      port: 8080,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }

            if (id.includes('fabric')) {
              return 'fabric-vendor';
            }
          },
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/domain/**', 'src/components/lib/**'],
        exclude: [
          '**/*.d.ts',
          '**/*.smoke.test.*',
          '**/__tests__/**',
          '**/test/**',
          '**/tests/**',
        ],
      },
    },
  };
});
