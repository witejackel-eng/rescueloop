import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/tests/integration/**/*.test.ts'],
    setupFiles: ['src/tests/integration/setup.ts'],
    testTimeout: 30000,
    server: {
      deps: {
        inline: ['server-only'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'server-only': path.resolve(__dirname, 'src/lib/__mocks__/server-only.ts'),
    },
  },
});
