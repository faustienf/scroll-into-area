import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "scroll-into-area": fileURLToPath(
        new URL("../src/scroll-into-area.ts", import.meta.url),
      ),
    },
  },
});
