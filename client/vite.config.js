import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../public",
    emptyOutDir: true,
    minify: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-office': ['pptxgenjs', 'exceljs', 'xlsx', 'jszip'],
          'vendor-mermaid': ['mermaid']
        }
      }
    }
  },
  server: { proxy: { "/api": "http://localhost:3456" } },
})
