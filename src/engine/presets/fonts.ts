/**
 * The approved v1 font shortlist (PLAN.md §3, signed off 2026-08-09).
 *
 * Home Assistant bundles **Roboto only**. Every other family is marked
 * `needsWebfont`, which the export milestone (M6) turns into an
 * `extra_module_url` loading snippet shipped alongside the YAML — a theme can
 * set `--ha-font-family-*` but cannot load a font.
 *
 * Stacks always fall back through Roboto (sans) or a system face, so a theme
 * still renders sensibly if the user skips the loader snippet.
 */
import type { FontOption } from "../types.ts";

const SANS_FALLBACK = "Roboto, Noto, sans-serif";
const SERIF_FALLBACK = "Georgia, serif";
const MONO_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Weights the generated theme actually uses: body 400, action 500, heading 700. */
const WEIGHTS = [300, 400, 500, 700] as const;

const google = (
  id: string,
  label: string,
  category: FontOption["category"],
  fallback: string,
): FontOption => ({
  id,
  label,
  category,
  // Multi-word families must be quoted in CSS — "Source Serif 4" is not a valid
  // unquoted <family-name> because "4" is not a valid CSS identifier.
  stack: `"${label}", ${fallback}`,
  needsWebfont: true,
  googleFontsFamily: label,
  weights: WEIGHTS,
});

export const FONTS: readonly FontOption[] = [
  // --- Sans (8) ---------------------------------------------------------
  {
    id: "roboto",
    label: "Roboto",
    category: "sans",
    // Verbatim HA default (`--ha-font-family-body` in template.css).
    stack: SANS_FALLBACK,
    needsWebfont: false,
  },
  google("inter", "Inter", "sans", SANS_FALLBACK),
  google("figtree", "Figtree", "sans", SANS_FALLBACK),
  google("dm-sans", "DM Sans", "sans", SANS_FALLBACK),
  google("nunito-sans", "Nunito Sans", "sans", SANS_FALLBACK),
  google("manrope", "Manrope", "sans", SANS_FALLBACK),
  google("outfit", "Outfit", "sans", SANS_FALLBACK),
  google("rubik", "Rubik", "sans", SANS_FALLBACK),

  // --- Serif (4) --------------------------------------------------------
  google("source-serif-4", "Source Serif 4", "serif", SERIF_FALLBACK),
  google("lora", "Lora", "serif", SERIF_FALLBACK),
  google("merriweather", "Merriweather", "serif", SERIF_FALLBACK),
  google("bitter", "Bitter", "serif", SERIF_FALLBACK),

  // --- Display serif (2) ------------------------------------------------
  google("fraunces", "Fraunces", "display-serif", SERIF_FALLBACK),
  google("playfair-display", "Playfair Display", "display-serif", SERIF_FALLBACK),

  // --- Mono (2) ---------------------------------------------------------
  google("jetbrains-mono", "JetBrains Mono", "mono", MONO_FALLBACK),
  google("ibm-plex-mono", "IBM Plex Mono", "mono", MONO_FALLBACK),

  // --- System (3) -------------------------------------------------------
  {
    id: "system-sans",
    label: "System sans",
    category: "system",
    // Verbatim HA default for `--ha-font-family-longform`.
    stack: "ui-sans-serif, system-ui, sans-serif",
    needsWebfont: false,
  },
  {
    id: "system-serif",
    label: "System serif",
    category: "system",
    stack: "ui-serif, Georgia, serif",
    needsWebfont: false,
  },
  {
    id: "system-mono",
    label: "System mono",
    category: "system",
    // Verbatim HA default for `--ha-font-family-code`.
    stack: "monospace",
    needsWebfont: false,
  },
];

const BY_ID = new Map(FONTS.map((f) => [f.id, f]));

/** Looks a font up by id, throwing on an unknown one. */
export function getFont(id: string): FontOption {
  const font = BY_ID.get(id);
  if (!font) throw new RangeError(`Unknown font id: ${JSON.stringify(id)}`);
  return font;
}

/** Display order for grouped dropdowns (M4). */
export const FONT_CATEGORY_LABELS: Record<FontOption["category"], string> = {
  sans: "Sans-serif",
  serif: "Serif",
  "display-serif": "Display serif",
  mono: "Monospace",
  system: "System",
};
