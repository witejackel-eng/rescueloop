import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    server: {
      deps: {
        // Don't process CSS in tests
        inline: [],
      },
    },
  },
  css: {
    // Disable PostCSS processing in test mode
    postcss: {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
