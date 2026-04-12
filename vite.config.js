import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // falla si el puerto está ocupado, en vez de cambiarlo silenciosamente
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        microsoftAuth: resolve(__dirname, "microsoft-auth.html"),
      },
    },
  },
});
