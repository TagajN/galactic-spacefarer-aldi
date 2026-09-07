import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import istanbul from "vite-plugin-istanbul";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    istanbul({
      include: "src/*",
      exclude: ["node_modules", "cypress"],
      extension: [".ts", ".tsx"],
      requireEnv: false,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4005",
        changeOrigin: true,
      },
    },
  },
});
