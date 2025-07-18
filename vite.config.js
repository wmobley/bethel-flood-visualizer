import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/bethel-flood-visualizer/',
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable source maps for debugging
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable manual chunking to avoid conflicts
      },
    },
  },
  define: {
    global: 'globalThis', // Fix for some libraries that expect 'global'
  },
});
