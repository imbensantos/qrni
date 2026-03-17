import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/app/vitest.config.ts", "convex/vitest.config.ts"],
  },
});
