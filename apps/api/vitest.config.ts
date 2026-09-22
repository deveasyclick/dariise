import { defineConfig } from "vitest/config";

/**
 * Every test lives under `src/test/`: `src/test/modules/` for the API modules,
 * `src/test/shared/` for shared infrastructure, and the top level for the
 * harness and the cross-cutting suites. The include pattern is deliberately
 * narrow so a file colocated with its source is ignored rather than run twice —
 * put it under `src/test/` instead.
 *
 * Files run one at a time because every integration suite shares a single test
 * database: concurrent workers would truncate or re-migrate it underneath each
 * other.
 */
export default defineConfig({
  test: {
    include: ["src/test/**/*.test.ts"],
    fileParallelism: false,
  },
});
