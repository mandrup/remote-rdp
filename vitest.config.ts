import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      reporter: ['text', 'html'],
    },
    include: ['test/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': '/src',
      '#mocks': path.resolve(__dirname, './test/__mocks__'),
    }
  }
})