import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '/Users/z_rkb/Downloads/BrokerPilot/client',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 5177,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
