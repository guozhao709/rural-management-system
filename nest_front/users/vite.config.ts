import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [vue(mode === 'test' ? {
    // jsdom 保留 public/ 的绝对 URL，避免将其作为 Node 文件导入。
    template: { transformAssetUrls: { includeAbsolute: false } },
  } : {})],
}))
