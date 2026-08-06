import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", ".next", "src/tests/integration/**", "src/tests/perf/**", "src/tests/e2e/**"],
    server: {
      deps: {
        // Inline server-only so it resolves in the test environment
        inline: ["server-only"],
      },
    },
  },
  css: {
    postcss: {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "src/lib/__mocks__/server-only.ts"),
    },
  },
});
