import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const dirname = path.dirname(fileURLToPath(import.meta.url))

// A standalone Vite instance for this milestone's own dev harness (see
// `README.md` in this directory). Kept separate from the root
// `vite.config.ts` — that file is the app shell's, and M3 does not own it —
// so `"@"` is re-aliased here to the same `src` directory by hand instead of
// importing the root config.
export default defineConfig({
  root: dirname,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "../../../"),
    },
  },
})
