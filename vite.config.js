import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { templateCompilerOptions } from '@tresjs/core'

// templateCompilerOptions is REQUIRED so Tres custom elements (<TresCanvas>, etc.) compile.
export default defineConfig({
  plugins: [vue({ ...templateCompilerOptions })],
})
