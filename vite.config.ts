import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  preview: {
    allowedHosts: [
      'districtsim-dev-695745414882.us-east4.run.app',
      'districtsim-dev--sd-budget-simulator-7381-2a4c8.us-east4.hosted.app'
    ]
  }
});