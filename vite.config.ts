import { defineConfig } from "vite"
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      // __dirname is the folder where this config file lives
      "@game": path.resolve(__dirname, "./src/game"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true, // This silences warnings from node_modules
        silenceDeprecations: [
          "import",
          "color-functions",
          "global-builtin",
          "if-function",
        ],
      },
    },
  },
})
