import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";

// Source unique de version : le package.json racine du monorepo (identique à /health côté API)
const rootPackageJson = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../package.json"), "utf-8"),
) as { version: string };

export default defineConfig({
  plugins: [react()],
  // Injecté au build pour afficher la version sans appel réseau
  define: {
    __APP_VERSION__: JSON.stringify(rootPackageJson.version),
  },
  css: {
    lightningcss: { errorRecovery: true },
  },
  resolve: {
    alias: {
      // Nouveaux alias pour la structure DDD
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@features": path.resolve(__dirname, "./src/features"),

      // Alias existant pour shared-types (à garder pour compatibilité)
      "@mutafriches/shared-types": path.resolve(
        __dirname,
        "../../packages/shared-types/src/index.ts",
      ),

      // Nouvel alias court pour shared-types (optionnel, plus pratique)
      "@shared-types": path.resolve(__dirname, "../../packages/shared-types/src"),

      // Alias pour résoudre le problème CommonJS/ESM dans le monorepo
      // Vite compile directement les sources TypeScript au lieu d'utiliser les fichiers dist/
      // Cela évite l'incompatibilité entre le CommonJS (pour NestJS) et l'ESM (pour Vite)
      // Docs: https://vitejs.dev/config/shared-options.html#resolve-alias
      // Issue monorepo: https://github.com/vitejs/vite/discussions/5370
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/friches": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "../dist-ui",
    emptyOutDir: true,
  },
});
