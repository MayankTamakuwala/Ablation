import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development the API runs as a separate process on 3000 and Vite serves
// the client on 5173. The proxy makes the browser see one origin, which keeps
// the session cookie working and means no CORS middleware anywhere.
// In production Vercel serves this build and the API from the same domain,
// so the proxy is a development-only concern.
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: false,
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
