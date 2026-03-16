import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "../src/shared"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Single file output — Webview cannot load multiple chunks
    rollupOptions: {
      output: {
        entryFileNames: "main.js",
        assetFileNames: "main[extname]",
        manualChunks: undefined,
      },
    },
    // Inline assets under 100kb to avoid extra requests
    assetsInlineLimit: 100000,
    // Webview requires single-file output — suppress the chunk size warning
    chunkSizeWarningLimit: 1000,
  },
});
