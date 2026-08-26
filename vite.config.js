import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  //
  base: "/code-diff-checker/",

  server: {
    port: 5173,
  },
});
