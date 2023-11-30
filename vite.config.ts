import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environmentMatchGlobs: [
      ["src/**/*.spec.ts", "happy-dom"],
      ["db/**/*.spec.ts", "node"],
      ["utils/**/*.spec.ts", "node"],
      ["src/lib/*.ts", "node"]
    ],
    include: ["src/**/*.spec.ts", "db/**/*.spec.ts", "utils/**/*.spec.ts"],
    includeSource: ["src/**/*.ts", "db/redis/*.ts", "utils/**/*.spec.ts"]
  }
});
