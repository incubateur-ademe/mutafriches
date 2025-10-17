import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
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
