import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [swc.vite()],
  test: {
    globals: true,
    environment: 'node',
    silent: !process.env.VERBOSE,
    setupFiles: ['./test/setup.ts'],
    reporters: process.env.VERBOSE ? 'verbose' : 'default',
    include: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'coverage/'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
