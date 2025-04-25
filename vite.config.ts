// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
      include: ['buffer', 'process', 'stream', 'http', 'url', 'util', 'events']
    })
  ],
  define: {
    'global': 'globalThis'
  }
});