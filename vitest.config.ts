import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["app/api/**", "lib/**"],
    },
    exclude: ["node_modules/**", "e2e/**"],
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
