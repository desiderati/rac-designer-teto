import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(root, 'client', 'src'),
      '@shared': path.resolve(root, 'shared'),
    },
  },
  test: {
    environment: 'node',
    include: ['server/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});
