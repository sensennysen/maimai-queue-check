import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
      },
    },
    sourcemap: mode === 'production' ? 'hidden' : true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name]-[hash].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|gif|svg|webp|avif|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (/css/i.test(ext)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // manualChunks is intentionally commented out — causes issues with Vercel's
        // output bundling (chunk splitting interferes with Vercel's file serving).
        // manualChunks: (id) => {
        //   if (id.includes('node_modules')) {
        //     if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/scheduler/')) {
        //       return 'vendor-react';
        //     }
        //     if (id.includes('react-router') || id.includes('@remix-run')) {
        //       return 'vendor-router';
        //     }
        //     if (id.includes('@mantine')) {
        //       return 'vendor-mantine';
        //     }
        //     if (id.includes('@tabler')) {
        //       return 'vendor-icons';
        //     }
        //     if (id.includes('@supabase')) {
        //       return 'vendor-supabase';
        //     }
        //     if (id.includes('lodash') || id.includes('date-fns') || id.includes('dayjs')) {
        //       return 'vendor-utils';
        //     }
        //   }
        // },
      },
    },
    chunkSizeWarningLimit: 800,
  },
}));
