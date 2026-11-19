// Unit and component tests (npm run test:unit). They run in a simulated browser (happy-dom), so
// they're fast and need no real browser; tests/e2e/ covers the real thing.
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vitest/config'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [vue(), AutoImport({ imports: ['vue'], dts: false })],
  resolve: { alias: { '~~': r('.'), '~': r('./app') } },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
  },
})
