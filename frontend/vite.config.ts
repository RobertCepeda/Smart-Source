import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === "github" ? "./" : "/",
  plugins: [react()],
  build: {
    outDir: mode === "github" ? "../docs" : "dist",
    emptyOutDir: true,
  },
}));
