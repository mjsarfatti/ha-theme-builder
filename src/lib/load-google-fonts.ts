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
