import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/perf/**/*.test.ts'],
    testTimeout: 30000,
    // Run sequentially by default for stable measurements
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    server: {
      deps: {
        inline: ['server-only'],
      },
    },
  },
  css: {
    postcss: {},
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'server-only': path.resolve(__dirname, 'src/lib/__mocks__/server-only.ts'),
    },
  },
});
