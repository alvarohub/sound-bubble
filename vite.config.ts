import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: {
    host: true,
    allowedHosts: true,
    strictPort: false,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});