import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend runs on 5173, backend on 8787.
// /api/* calls are proxied to the Express server so you never expose the API key in the browser.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
