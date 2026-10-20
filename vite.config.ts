import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { configDefaults, defineConfig } from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // GitHub Pages serves the site from a sub-path; PR previews override it with BASE_PATH.
  base: process.env.BASE_PATH || "/ha-theme-builder/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Vitest skips only `.git` by default. Exclude the worktrees in `.claude/`.
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
})
