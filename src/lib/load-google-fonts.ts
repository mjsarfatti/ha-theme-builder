/**
 * Loads the builder's own font-picker specimens (`docs/UX-SPEC.md` §3.2):
 * "Load [`FONTS.filter(f => f.needsWebfont)`] from Google Fonts at 400/500/700
 * with `display=swap` in the builder's own `index.html`." Injected from here
 * instead of hand-listed in `index.html` so the request always matches
 * `FONTS` exactly — the same "read the list from the engine, never hardcode
 * it" rule the sidebar's own presets follow. Builder-side only: unrelated to
 * the exported theme, which ships its own `extra_module_url` snippet (§1.4).
 */
import { FONTS } from "@/engine"

const WEIGHTS = "400;500;700"

let injected = false

export function loadGoogleFonts(doc: Document = document): void {
  if (injected) return
  injected = true

  const families = FONTS.filter((font) => font.needsWebfont && font.googleFontsFamily)
    .map((font) => `family=${font.googleFontsFamily!.replace(/ /g, "+")}:wght@${WEIGHTS}`)
    .join("&")
  if (!families) return

  const link = doc.createElement("link")
  link.rel = "stylesheet"
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  doc.head.appendChild(link)
}
