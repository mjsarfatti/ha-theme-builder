/**
 * Test helper: reads `.references/template.css` — the knob spec — and resolves
 * it into a flat `name -> value` map.
 *
 * Parsing the real file rather than hand-copying its values is deliberate: it
 * makes the "default config reproduces HA's current theme" test a genuine
 * regression net. If the spec file changes, the test notices.
 */
import { readReference } from "./read-reference.ts";

/**
 * Variables `template.css` references but does not define — they live in HA's
 * semantic tier. Values taken from `ha_theme_analysis.md` §2.2 (text tokens)
 * and §2.4 (font weights).
 */
const EXTERNALS: Record<string, string> = {
  "ha-font-weight-light": "300",
  "ha-font-weight-normal": "400",
  "ha-font-weight-medium": "500",
  "ha-font-weight-bold": "700",
  "ha-color-text-primary": "var(--ha-color-neutral-05)",
  "ha-color-text-secondary": "var(--ha-color-neutral-40)",
  "ha-color-text-disabled": "var(--ha-color-neutral-60)",
};

let cache: Record<string, string> | undefined;

/**
 * Returns every custom property declared in `template.css`, with `var()`
 * references resolved and whitespace normalised.
 */
export function parseTemplateCss(): Record<string, string> {
  if (cache) return cache;

  const source = readReference("template.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const raw: Record<string, string> = { ...EXTERNALS };

  for (const match of source.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    raw[match[1]] = match[2].replace(/\s+/g, " ").trim();
  }

  const resolving = new Set<string>();
  const resolve = (key: string): string => {
    const value = raw[key];
    if (value === undefined) throw new Error(`template.css: undefined variable --${key}`);
    if (resolving.has(key)) throw new Error(`template.css: cyclic variable --${key}`);
    resolving.add(key);
    const out = value.replace(/var\(\s*--([a-z0-9-]+)\s*\)/gi, (_, ref: string) => resolve(ref));
    resolving.delete(key);
    return out;
  };

  cache = Object.fromEntries(Object.keys(raw).map((key) => [key, resolve(key)]));
  return cache;
}

/** Just the keys `template.css` itself declares (excludes {@link EXTERNALS}). */
export function templateCssKeys(): string[] {
  return Object.keys(parseTemplateCss()).filter((k) => !(k in EXTERNALS));
}
