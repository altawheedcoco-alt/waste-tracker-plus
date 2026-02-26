import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          if (id.includes('react-router')) return 'router';
          if (id.includes('@supabase/')) return 'supabase';
          if (id.includes('@radix-ui/')) return 'ui';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('mapbox-gl') || id.includes('leaflet')) return 'maps';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('@tanstack/')) return 'query';
          if (id.includes('date-fns')) return 'date-utils';
          if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform/')) return 'forms';
          if (id.includes('html2canvas') || id.includes('jspdf') || id.includes('jszip')) return 'export-tools';
        },
      },
    },
    reportCompressedSize: false,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  optimizeDeps: {
    include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime"],
    force: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
