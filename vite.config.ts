import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [];

  try {
    const { default: react } = await import('@vitejs/plugin-react-swc');
    plugins.push(react());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Some tooling evaluates this config through `[eval]`, which breaks createRequire(import.meta.url).
    if (!message.includes('Received \'[eval]\'') || !message.includes('file URL object')) {
      throw error;
    }
  }

  if (mode === 'development') {
    const { componentTagger } = await import('lovable-tagger');
    plugins.push(componentTagger());
  }

  return {
    server: {
      host: '::',
      port: 8080,
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
