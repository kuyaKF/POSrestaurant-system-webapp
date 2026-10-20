import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5273,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:4100",
      "/uploads": "http://localhost:4100",
    },
  },
});
