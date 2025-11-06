import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],

    // En CI : isolation maximale avec plusieurs forks
    pool: process.env.CI ? "forks" : "threads",
    poolOptions: process.env.CI
      ? {
          forks: {
            singleFork: false, // Plusieurs processus pour isoler les tests
            minForks: 1,
            maxForks: 3, // Limiter le parallélisme pour éviter surcharge
          },
        }
      : {
          threads: {
            singleThread: false,
          },
        },

    // Timeouts augmentés pour CI
    testTimeout: process.env.CI ? 30000 : 5000,
    hookTimeout: process.env.CI ? 30000 : 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
