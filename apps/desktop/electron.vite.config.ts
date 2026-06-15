import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

const root = dirname(fileURLToPath(import.meta.url));

// Electron build for the canonical Otto desktop. The renderer is the SAME React app the
// web preview uses (index.html); main/preload are built as .cjs (this package is type:module).
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      lib: { entry: resolve(root, 'electron/main.ts'), formats: ['cjs'] },
      // `electron` is a devDependency, so externalizeDepsPlugin (which externalizes
      // `dependencies`) leaves it bundleable in lib mode — which inlines the npm stub's
      // getElectronPath() and crashes the main process. We externalize it explicitly. But in
      // lib mode this explicit `external` array overrides the plugin's dependency list, so we
      // must also re-externalize the Letta SDK here — otherwise it gets inlined into a chunk
      // and resolves its bundled CLI from the wrong base dir. Keep both external so the bundle
      // does `require("electron")` / `require("@letta-ai/...")` and loads them from node_modules.
      rollupOptions: { external: ['electron', 'pg', /^@letta-ai\//], output: { entryFileNames: 'index.cjs' } },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
      lib: { entry: resolve(root, 'electron/preload.ts'), formats: ['cjs'] },
      rollupOptions: { external: ['electron'], output: { entryFileNames: 'index.cjs' } },
    },
  },
  renderer: {
    root,
    plugins: [react()],
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['streamdown'],
    },
    build: {
      outDir: 'out/renderer',
      rollupOptions: { input: resolve(root, 'index.html') },
    },
  },
});
