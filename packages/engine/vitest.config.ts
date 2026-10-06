import { defineConfig } from "vitest/config";

/** The engine is pure, so the tests are plain unit tests with no fixtures to share. */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
