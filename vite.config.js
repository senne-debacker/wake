import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: ['.trycloudflare.com'], // the https tunnel of `npm run phone`
  },
  base: './', // relative asset paths: the built site works from any folder or sub-path
  build: {
    chunkSizeWarningLimit: 1200, // three.js alone is ~1 MB; one bundle is fine for this project
  },
})
