import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup.ts"],
    fileParallelism: false, // tests share one Neon test branch
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
