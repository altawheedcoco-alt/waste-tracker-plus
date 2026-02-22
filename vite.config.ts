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
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          if (id.includes('react-router')) return 'router';
          if (id.includes('@supabase/')) return 'supabase';
          if (id.includes('@radix-ui/')) return 'ui';
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
