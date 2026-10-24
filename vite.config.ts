import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        psylo: 'psylo.html',
        nobody: 'nobody.html',
      },
    },
  },
});
