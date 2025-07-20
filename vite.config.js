import { defineConfig } from 'vite';
import zipPack from 'vite-plugin-zip-pack';

// https://vitejs.dev/config/
export default defineConfig({
  // This ensures asset paths are relative, which is critical for Chrome Extensions.
  base: './',

  server: {
    // Your existing setting is preserved.
    port: 3000
  },
  
  build: {
    // Your existing setting is preserved.
    target: 'esnext',
    // We will use the default 'dist' output directory.
    outDir: 'dist',
  },

  plugins: [
    // This plugin runs after the build is complete.
    zipPack({
      // It zips the contents of the 'dist' directory...
      inDir: 'dist',
      // ...and places the final ZIP file in a new 'release' directory.
      outDir: 'release',
      // The ZIP file is named using the version from package.json.
      outFileName: `ParkourHero_v${process.env.npm_package_version}.zip`,
    }),
  ],
});