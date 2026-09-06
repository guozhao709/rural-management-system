import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default defineConfig(env => mergeConfig(viteConfig(env), {
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.{ts,tsx}'],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx,vue}'],
      exclude: ['src/**/*.spec.{ts,tsx}', 'src/**/*.d.ts'],
      reporter: ['text', 'html', 'json-summary'],
    },
  },
}))
