import { defineConfig } from 'vite';
import zipPack from 'vite-plugin-zip-pack';

export default defineConfig({
  base: './',
  server: {
    port: 3000
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        editor: 'editor.html',
      },
    },
  },
  plugins: [

    zipPack({
      inDir: 'dist',
      outDir: 'release',
      outFileName: `ParkourHero_v${process.env.npm_package_version}.zip`,
    }),
  ],
});