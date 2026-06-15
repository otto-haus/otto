import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // streamdown prebundles its own React copy without this — hooks crash at RuntimeProvider boot.
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['streamdown'],
  },
});
