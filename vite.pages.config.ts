import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const BASE = "/XRP-Clan-Analytics/";

export default defineConfig({
  root: "pages",
  base: BASE,
  publicDir: "../public",
  plugins: [
    tanstackRouter({
      target: "react",
      routesDirectory: "../src/routes",
      generatedRouteTree: "../src/routeTree.gen.ts",
    }),
    tailwindcss(),
    viteReact(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    sourcemap: false,
  },
});
