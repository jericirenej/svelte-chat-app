import { sveltekit } from "@sveltejs/kit/vite";
import type { PreviewServer, ViteDevServer } from "vite";
import { defineConfig } from "vitest/config";
import { createSocketServer } from "./src/lib/server/socket.global.js";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig({
  esbuild: { target: "es2022" },
  plugins: [
    sveltekit(),
    svelteTesting(),
    {
      name: "socketIOIntegration",
      async configureServer(server: ViteDevServer) {
        await createSocketServer(server.httpServer);
      },
      async configurePreviewServer(server: PreviewServer) {
        await createSocketServer(server.httpServer);
      }
    }
  ],

  test: {
    environmentMatchGlobs: [
      ["src/components/**/*.spec.ts", "happy-dom"],
      ["db/**/*.spec.ts", "node"],
      ["utils/**/*.spec.ts", "node"],
      ["src/lib/*.ts", "node"]
    ],
    setupFiles: ["./vitest-setup.ts"],
    include: ["src/**/*.spec.ts", "db/**/*.spec.ts", "utils/**/*.spec.ts"],
    includeSource: ["src/**/*.ts", "db/redis/*.ts", "utils/**/*.spec.ts"]
  }
});
