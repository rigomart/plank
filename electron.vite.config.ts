import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    envPrefix: 'GITHUB_',
    build: {
      rollupOptions: {
        external: ['@anthropic-ai/claude-agent-sdk']
      }
    }
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler']
        }
      }),
      tailwindcss()
    ]
  }
})
