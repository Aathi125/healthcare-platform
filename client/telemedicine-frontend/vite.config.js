import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3001,
    strictPort: false,
    proxy: {
      "/api/auth": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/api/v1/video": {
        target: "http://127.0.0.1:4007",
        changeOrigin: true,
      },
      "/api/v1/consult": {
        target: "http://127.0.0.1:4007",
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  optimizeDeps: {
    include: ["twilio-video"],
  },
});
