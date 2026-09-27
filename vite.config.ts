import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const mockServerOrigin = 'http://127.0.0.1:4010';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/images': mockServerOrigin,
      '/posts': mockServerOrigin
    }
  },
  test: {
    environment: 'jsdom'
  }
});
