import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: import.meta.dirname,
    include: ["server/**/*.test.ts", "shared/**/*.test.ts", "client/**/*.test.tsx"],
    environment: "node",
  },
});
