import { createSocketServer } from "./src/lib/server/socket.global.js";
import { sveltekit } from "@sveltejs/kit/vite";
import type { PreviewServer, ViteDevServer } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    sveltekit(),
    {
      name: "socketIOIntegration",
      configureServer(server: ViteDevServer) {
        createSocketServer(server.httpServer);
      },
      configurePreviewServer(server: PreviewServer) {
        createSocketServer(server.httpServer);
      }
    }
  ],
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
