import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const BASE = process.env.PAGES_BASE || "./";

export default defineConfig({
  root: "pages",
  base: BASE,
  publicDir: "../public",
  define: {
    "import.meta.env.VITE_STATIC_SPA": JSON.stringify("1"),
  },
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
    outDir: process.env.PAGES_OUTDIR || "../docs",
    emptyOutDir: true,
    sourcemap: false,
  },
});
