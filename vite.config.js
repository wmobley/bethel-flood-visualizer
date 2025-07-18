import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  server: {
    proxy: {
      '/api/geojson': {
        target: 'https://web.corral.tacc.utexas.edu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geojson/, '/setxuifl/flood-sensor-optimization/water_risk.geojson')
      }
    }
  }
});
