import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3002,
    strictPort: true,
    host: 'localhost'
  },
  build: {
    outDir: 'dist'
  }
});
