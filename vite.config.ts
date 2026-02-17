import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isElectron = process.env.ELECTRON === 'true';
  return {
    base: isElectron ? './' : '/',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // Gera hash único para cada build - força navegador a baixar nova versão
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`
        }
      },
      // Limpa a pasta dist antes de cada build
      emptyOutDir: true,
      // Gera sourcemaps para debug em produção
      sourcemap: false
    }
  };
});
