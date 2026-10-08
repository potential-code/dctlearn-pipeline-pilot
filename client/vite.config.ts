import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import blobMap from './tools/blob-map.json'

const root = resolve(import.meta.dirname, '..')
const blobs = blobMap as Record<string, { file: string; mime: string }>

/** Fails the build if anything under server/ is pulled into the client bundle. */
function forbidServerCode(): Plugin {
  const serverDir = `${resolve(root, 'server')}/`
  return {
    name: 'dct:forbid-server-code',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || source.startsWith('\0')) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      if (resolved?.id.startsWith(serverDir)) {
        throw new Error(
          `Server code must not be imported by the client: ${source} (from ${importer})`,
        )
      }
      return null
    },
  }
}

/**
 * The mockup references images and fonts as /_blob/<id> (Claude Design asset urls), in markup,
 * logic and CSS. Serve those ids from the mapped repo files in dev and emit them in the build.
 */
function dctBlobs(): Plugin {
  return {
    name: 'dct:blobs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = req.url?.match(/^\/_blob\/([0-9a-f]{32})/)
        const entry = m?.[1] ? blobs[m[1]] : undefined
        if (!entry) return next()
        res.setHeader('Content-Type', entry.mime)
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.end(readFileSync(resolve(root, entry.file)))
      })
    },
    generateBundle() {
      for (const [id, entry] of Object.entries(blobs)) {
        this.emitFile({
          type: 'asset',
          fileName: `_blob/${id}`,
          source: readFileSync(resolve(root, entry.file)),
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [
    forbidServerCode(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
      quoteStyle: 'single',
      semicolons: false,
    }),
    react(),
    dctBlobs(),
  ],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@shared': resolve(root, 'shared'),
      '@assets': resolve(root, 'seed/assets'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    fs: { allow: [root] },
    proxy: { '/api': { target: 'http://localhost:8000', changeOrigin: false } },
  },
  preview: { port: 5173 },
  build: { outDir: 'dist', chunkSizeWarningLimit: 1500 },
})
