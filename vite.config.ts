/// <reference types="vitest/config" />
import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Serves `.references/**?raw` imports as plain text.
 *
 * The engine tests diff the generated presets and the default theme against the
 * read-only source material in `.references/`. Vite's own `?raw` loader handles
 * the HTML pages fine, but `@tailwindcss/vite` claims every `.css` file and
 * hands back an empty string for `template.css`. Running first, and only for
 * paths inside `.references/`, keeps that spec file readable without giving the
 * browser-targeted `tsconfig.app.json` a dependency on Node's types.
 *
 * Nothing in `src/` imports these at runtime, so this never affects the bundle.
 */
const REFERENCES_RAW = "\0references-raw:"

function referencesRaw(): Plugin {
  return {
    name: "references-raw",
    enforce: "pre",
    resolveId(source, importer) {
      if (!source.endsWith("?raw") || !source.includes(".references/")) return null
      const file = source.slice(0, -"?raw".length)
      const base = importer ? path.dirname(importer) : dirname
      // A \0-prefixed virtual id, with the path encoded so the id carries no
      // file extension at all. Both matter: Tailwind's transform claims
      // anything ending in .css, and Vitest stubs CSS modules out to an empty
      // string by extension before either plugin is consulted.
      const encoded = Buffer.from(path.resolve(base, file)).toString("base64url")
      return REFERENCES_RAW + encoded
    },
    async load(id) {
      if (!id.startsWith(REFERENCES_RAW)) return null
      const file = Buffer.from(id.slice(REFERENCES_RAW.length), "base64url").toString()
      return `export default ${JSON.stringify(await readFile(file, "utf8"))}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Project (not user/org) GitHub Pages site: assets are served from
  // https://<owner>.github.io/ha-theme-builder/, so every asset URL in the
  // production build must be prefixed accordingly.
  base: "/ha-theme-builder/",
  plugins: [referencesRaw(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
})
