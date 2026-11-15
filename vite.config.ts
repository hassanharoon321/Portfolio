import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

export default defineConfig({
  // Relative asset paths, so the build works at a domain root or under a sub-path.
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    // Same output folder the old Create React App build used, so hosting settings keep working.
    outDir: "build"
  }
});
