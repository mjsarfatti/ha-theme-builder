import type { FontOption } from "../types.ts";

const SANS_FALLBACK = "Roboto, Noto, sans-serif";
const SERIF_FALLBACK = "Georgia, serif";
const MONO_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, monospace";

/** Weights the theme uses: body 400, action 500, heading 700. */
const WEIGHTS = [300, 400, 500, 700] as const;

/** Creates a font option for a Google Fonts family. */
const google = (
  id: string,
  label: string,
  category: FontOption["category"],
  fallback: string,
): FontOption => ({
  id,
  label,
  category,
  // CSS rejects an unquoted "Source Serif 4".
  stack: `"${label}", ${fallback}`,
  needsWebfont: true,
  googleFontsFamily: label,
  weights: WEIGHTS,
});

/**
 * The v1 font list.
 *
 * HA bundles Roboto only, so every other family has `needsWebfont` set and
 * needs an `extra_module_url` loader. Stacks fall back to Roboto or a
 * system font until the font loads.
 */
export const FONTS: readonly FontOption[] = [
  {
    id: "roboto",
    label: "Roboto",
    category: "sans",
    // HA default for `--ha-font-family-body`.
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

  google("source-serif-4", "Source Serif 4", "serif", SERIF_FALLBACK),
  google("lora", "Lora", "serif", SERIF_FALLBACK),
  google("merriweather", "Merriweather", "serif", SERIF_FALLBACK),
  google("bitter", "Bitter", "serif", SERIF_FALLBACK),

  google("fraunces", "Fraunces", "display-serif", SERIF_FALLBACK),
  google("playfair-display", "Playfair Display", "display-serif", SERIF_FALLBACK),

  google("jetbrains-mono", "JetBrains Mono", "mono", MONO_FALLBACK),
  google("ibm-plex-mono", "IBM Plex Mono", "mono", MONO_FALLBACK),

  {
    id: "system-sans",
    label: "System sans",
    category: "system",
    // HA default for `--ha-font-family-longform`.
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
    // HA default for `--ha-font-family-code`.
    stack: "monospace",
    needsWebfont: false,
  },
];

const BY_ID = new Map(FONTS.map((f) => [f.id, f]));

/** Returns the font with this id. Throws a `RangeError` for an unknown id. */
export function getFont(id: string): FontOption {
  const font = BY_ID.get(id);
  if (!font) throw new RangeError(`Unknown font id: ${JSON.stringify(id)}`);
  return font;
}

/** Category labels, in the display order of grouped lists. */
export const FONT_CATEGORY_LABELS: Record<FontOption["category"], string> = {
  sans: "Sans-serif",
  serif: "Serif",
  "display-serif": "Display serif",
  mono: "Monospace",
  system: "System",
};
