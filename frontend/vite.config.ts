import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// import basicSsl from "@vitejs/plugin-basic-ssl";  // Re-enable for phone GPS testing

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // https: {},       // Disabled — causes mixed-content blocks with HTTP backend
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    // basicSsl(),      // Re-enable together with https:{} for phone GPS testing
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
