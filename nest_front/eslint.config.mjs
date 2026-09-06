import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['**/dist/**', '**/coverage/**', '**/playwright-report/**', '**/test-results/**', '**/node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  vue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  { files: ['src/**/*.{ts,tsx,vue}'], languageOptions: { globals: globals.browser } },
  { files: ['*.config.{ts,mjs}', 'e2e/**/*.ts'], languageOptions: { globals: globals.node } },
)
