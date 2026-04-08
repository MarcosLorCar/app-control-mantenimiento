import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/helpers/db.ts'],
    testTimeout: 30000,
    fileParallelism: false,
  },
})
