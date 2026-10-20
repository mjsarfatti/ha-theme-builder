import { readReference } from "./read-reference.ts";

/** Variables that `template.css` uses and that HA defines in its semantic tier. */
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
 * Returns every custom property of `template.css`, with `var()` resolved.
 *
 * Tests parse the real file, so a change to the spec file fails the
 * default-config regression test.
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

/** Returns the keys that `template.css` declares. Excludes {@link EXTERNALS}. */
export function templateCssKeys(): string[] {
  return Object.keys(parseTemplateCss()).filter((k) => !(k in EXTERNALS));
}
