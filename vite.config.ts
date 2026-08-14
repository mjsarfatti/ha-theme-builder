import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { configDefaults, defineConfig } from "vitest/config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // Project (not user/org) GitHub Pages site: assets are served from
  // https://<owner>.github.io/ha-theme-builder/, so every asset URL in the
  // production build must be prefixed accordingly.
  base: "/ha-theme-builder/",
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
    // `.claude/worktrees/` holds other Claude Code sessions' checkouts of
    // this same repo, sometimes on branches mid-edit — vitest's default
    // excludes don't cover dot-directories other than `.git`, so without
    // this it discovers and runs their test files too, past those branches'
    // own broken/half-finished states. Real CI never sees this directory
    // (gitignored), but a local run does unless it's excluded explicitly.
    exclude: [...configDefaults.exclude, "**/.claude/**"],
  },
})
