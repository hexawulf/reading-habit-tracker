import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  publicDir: 'public',
  // If there are other configurations, they should be preserved.
  // For now, we are only adding publicDir.
  // Example of how other configurations might look:
  // resolve: {
  //   alias: {
  //     '@': resolve(__dirname, 'src'),
  //   },
  // },
})
