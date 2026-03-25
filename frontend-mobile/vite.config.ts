import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const extensions = [
  '.mjs',
  '.web.tsx',
  '.tsx',
  '.web.ts',
  '.ts',
  '.web.jsx',
  '.jsx',
  '.web.js',
  '.js',
  '.css',
  '.json',
];

const rollupPlugin = (matchers: RegExp[]) => ({
  name: 'js-in-jsx',
  load(id: string) {
    if (matchers.some((matcher) => matcher.test(id)) && id.endsWith('.js')) {
      const file = readFileSync(id, { encoding: 'utf-8' });
      return esbuild.transformSync(file, { loader: 'jsx', jsx: 'automatic' });
    }
  },
});

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/frontend-mobile',
  define: {
    global: 'window',
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  resolve: {
    extensions,
    conditions: ['@pulse-map/source', 'browser', 'module', 'import', 'default'],
    alias: [
      // Specific packages must come before the generic react-native alias
      {
        find: 'react-native-maps',
        replacement: `${__dirname}/src/shims/react-native-maps.web.tsx`,
      },
      {
        find: 'react-native-geolocation-service',
        replacement: `${__dirname}/src/shims/react-native-geolocation-service.web.ts`,
      },
      { find: 'react-native-svg', replacement: 'react-native-svg-web' },
      {
        find: '@react-native-async-storage/async-storage',
        replacement: `${__dirname}/src/shims/async-storage.web.ts`,
      },
      {
        find: '@react-native/assets-registry/registry',
        replacement: 'react-native-web/dist/modules/AssetRegistry/index',
      },
      // Generic react-native → react-native-web (must be last to not clobber specific packages)
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],
  },
  build: {
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
    outDir: '../dist/frontend-mobile/web',
    rollupOptions: {
      plugins: [rollupPlugin([/react-native-vector-icons/])],
    },
  },
  server: {
    port: 4200,
    host: 'localhost',
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: extensions,
      jsx: 'automatic',
      loader: { '.js': 'jsx' },
    },
  },
  plugins: [react(), nxViteTsPaths()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
});
