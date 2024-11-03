import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// needed this for jolt-physics – not sure if it works outside of local dev
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  worker: {
    format: "es"
  },
  plugins: [react(), crossOriginIsolation()],
  assetsInclude: ['**/*.glb'],
  optimizeDeps: {
    exclude: ['jolt-physics'],
    esbuildOptions: { target: 'esnext' } // Enable modern syntax support
  },
  build: {
    rollupOptions: {
      output: {
        format: 'es'
      }
    },
    target: "esnext"
  }
})
