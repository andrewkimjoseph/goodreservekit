import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      "@cnvlabskoxyz/goodreservekit": path.resolve(
        __dirname,
        "../../packages/goodreservekit/src/index.ts",
      ),
    },
  },
});
