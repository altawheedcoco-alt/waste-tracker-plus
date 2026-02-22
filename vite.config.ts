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
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          if (id.includes('react-router')) return 'router';
          if (id.includes('@radix-ui/')) return 'ui-primitives';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('@supabase/')) return 'supabase';
          if (id.includes('framer-motion')) return 'animation';
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx')) return 'export';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'forms';
          if (id.includes('qrcode') || id.includes('html5-qrcode') || id.includes('react-barcode')) return 'qr-barcode';
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype') || id.includes('unified') || id.includes('micromark') || id.includes('mdast')) return 'markdown';
          if (id.includes('date-fns') || id.includes('react-day-picker')) return 'date-utils';
          if (id.includes('leaflet')) return 'maps';
          if (id.includes('embla-carousel') || id.includes('vaul') || id.includes('cmdk') || id.includes('input-otp')) return 'ui-extras';
          if (id.includes('sonner')) return 'toast';
          if (id.includes('jszip')) return 'zip';
          if (id.includes('node_modules/')) return 'vendor';
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
