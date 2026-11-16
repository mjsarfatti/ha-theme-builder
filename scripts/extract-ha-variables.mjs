#!/usr/bin/env node
/**
 * Generates `src/catalogue/ha-variables.ts` from the HA frontend source.
 *
 * The script resolves a ref of `home-assistant/frontend` (default `dev`) to
 * a commit SHA. It reads the theme files at that SHA, parses every
 * `--name: value;` declaration in the named `css` exports, and writes one
 * typed entry for each variable. `src/catalogue/README.md` states the rules.
 *
 * Usage: `node scripts/extract-ha-variables.mjs [ref]`
 * Behind an HTTP proxy, set `NODE_USE_ENV_PROXY=1`.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "catalogue", "ha-variables.ts");
const REPO = "home-assistant/frontend";
const REF = process.argv[2] ?? "dev";
const THEME = "src/resources/theme";
const APPLY = "src/common/dom/apply_themes_on_element.ts";

// Load order of `themeStyles` (theme.ts). A later light declaration wins.
const SOURCES = [
  { file: `${THEME}/core.globals.ts`, blocks: { coreStyles: "light" } },
  { file: `${THEME}/main.globals.ts`, blocks: { mainStyles: "light" } },
  { file: `${THEME}/typography.globals.ts`, blocks: { typographyStyles: "light" } },
  { file: `${THEME}/semantic.globals.ts`, blocks: { semanticStyles: "light", darkSemanticStyles: "dark" } },
  { file: `${THEME}/color/core.globals.ts`, blocks: { coreColorStyles: "light" } },
  {
    file: `${THEME}/color/semantic.globals.ts`,
    blocks: { semanticColorStyles: "light", darkSemanticColorStyles: "dark" },
  },
  { file: `${THEME}/color/color.globals.ts`, blocks: { colorStyles: "light", darkColorStyles: "dark" } },
  { file: `${THEME}/color/wa.globals.ts`, blocks: { waColorStyles: "light" } },
  { file: `${THEME}/wa.globals.ts`, blocks: { waMainStyles: "light" } },
];

const CORE_FILES = new Set([
  `${THEME}/core.globals.ts`,
  `${THEME}/main.globals.ts`,
  `${THEME}/typography.globals.ts`,
  `${THEME}/color/core.globals.ts`,
]);
const COMPONENT_FILES = new Set([`${THEME}/wa.globals.ts`, `${THEME}/color/wa.globals.ts`]);
const COMPONENT_PREFIXES = [
  "app-",
  "chip-",
  "codemirror-",
  "data-table-",
  "ha-assist-chip-",
  "ha-button-",
  "history-",
  "input-",
  "label-badge-",
  "markdown-",
  "mdc-",
  "sidebar-",
  "slider-",
  "table-",
];
const COMPONENT_NAMES = new Set(["bar-box-shadow", "map-filter"]);

/** Returns the tier of a variable from its source file and its name. */
function tierOf(file, name) {
  if (CORE_FILES.has(file)) return "core";
  if (COMPONENT_FILES.has(file)) return "component";
  if (COMPONENT_NAMES.has(name) || COMPONENT_PREFIXES.some((p) => name.startsWith(p))) return "component";
  return "semantic";
}

/** Fetches a text resource and fails on a non-2xx status. */
async function get(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.text();
}

const sha = (
  await get(`https://api.github.com/repos/${REPO}/commits/${REF}`, { Accept: "application/vnd.github.sha" })
).trim();
if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`unexpected SHA: ${sha}`);
const raw = (path) => get(`https://raw.githubusercontent.com/${REPO}/${sha}/${path}`);

/** Replaces comments with spaces, so that line numbers stay correct. */
const blankComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

/**
 * Returns the declarations of each named `css` export of a source file.
 *
 * Declarations inside an `@media` block are skipped: the only one is the
 * reduced-motion block of `core.globals.ts`, which is not a theme default.
 */
function parseBlocks(text) {
  const lines = blankComments(text).split("\n");
  const blocks = {};
  let current = null;
  let depth = 0;
  let inMedia = false;
  let pending = null;
  lines.forEach((line, i) => {
    const start = line.match(/^export const (\w+) = css`/);
    if (start) {
      current = blocks[start[1]] = [];
      depth = 0;
      return;
    }
    if (!current) return;
    if (/^`;/.test(line)) {
      current = null;
      return;
    }
    if (/^\s*@media/.test(line) && depth === 0) inMedia = true;
    if (pending) {
      pending.value += ` ${line.trim()}`;
    } else if (depth === 1 && !inMedia) {
      const decl = line.match(/^\s*--([\w-]+)\s*:\s*(.*)$/);
      if (decl) pending = { name: decl[1], value: decl[2].trim(), line: i + 1 };
    }
    if (pending && pending.value.includes(";")) {
      current.push({ ...pending, value: pending.value.slice(0, pending.value.indexOf(";")).trim() });
      pending = null;
    }
    depth += (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
    if (depth === 0) inMedia = false;
  });
  return blocks;
}

const entries = new Map();
for (const { file, blocks } of SOURCES) {
  const parsed = parseBlocks(await raw(file));
  for (const [block, mode] of Object.entries(blocks)) {
    if (!parsed[block]?.length) throw new Error(`no declarations in ${file} ${block}`);
    for (const { name, value, line } of parsed[block]) {
      const entry = entries.get(name) ?? {
        name,
        tier: tierOf(file, name),
        light: null,
        dark: null,
        source: null,
        darkSource: null,
        computed: null,
      };
      if (mode === "light") {
        Object.assign(entry, { light: value, source: `${file}:${line}`, tier: tierOf(file, name) });
      } else {
        Object.assign(entry, { dark: value, darkSource: `${file}:${line}` });
        entry.source ??= entry.darkSource;
      }
      entries.set(name, entry);
    }
  }
}

const applyLines = (await raw(APPLY)).split("\n");
/** Returns `file:line` of the first line in `apply_themes_on_element.ts` that contains `needle`. */
function applySource(needle) {
  const i = applyLines.findIndex((l) => l.includes(needle));
  if (i === -1) throw new Error(`${APPLY} no longer contains ${needle}`);
  return `${APPLY}:${i + 1}`;
}

// Values that the default-theme branch computes from the profile colors.
// `primary-color` and `accent-color` are copies of the input and are not listed.
const DEFAULT_THEME = [
  "light-primary-color",
  "dark-primary-color",
  "darker-primary-color",
  "text-primary-color",
  "text-light-primary-color",
  "state-icon-color",
  "text-accent-color",
];
for (const name of DEFAULT_THEME) {
  const at = applySource(`themeRules["${name}"] =`);
  const entry = entries.get(name) ?? {
    name,
    tier: "semantic",
    light: null,
    dark: null,
    source: at,
    darkSource: null,
  };
  entries.set(name, { ...entry, computed: "default-theme" });
}
applySource(`themeRules["app-header-background-color"]`);
entries.get("app-header-background-color").computed = "default-theme-dark";
// generateColorPalette() names its steps `5, 10, … 95`, so `ha-color-primary-05` is not written.
applySource(`generateColorPalette(primaryColor, "primary")`);
for (const entry of entries.values()) {
  if (/^ha-color-primary-[1-9]\d$/.test(entry.name)) entry.computed = "default-theme";
  if (entry.name.startsWith("rgb-")) entry.computed = "rgb-companion";
}
applySource("const rgbKey = `rgb-${key}`");

const referencesOf = (...values) => [
  ...new Set(values.flatMap((v) => (v ? [...v.matchAll(/var\(\s*--([\w-]+)/g)].map((m) => m[1]) : []))),
];

const list = [...entries.values()].map((e) => ({
  name: e.name,
  tier: e.tier,
  light: e.light,
  dark: e.dark,
  references: referencesOf(e.light, e.dark),
  source: e.source,
  darkSource: e.darkSource,
  computed: e.computed,
}));

let out = `// Generated by scripts/extract-ha-variables.mjs from ${REPO}@${sha}.
// Regenerate with \`node scripts/extract-ha-variables.mjs\`. Edits in this file
// are overwritten.

/** The \`${REPO}\` commit that the catalogue was read from. */
export const HA_FRONTEND_SHA = "${sha}";

/** Tier of a variable. \`src/catalogue/README.md\` states the rule. */
export type HaVariableTier = "core" | "semantic" | "component";

/**
 * Condition under which HA computes a variable at apply time.
 *
 * - \`default-theme\`: the built-in theme with a profile color set
 * - \`default-theme-dark\`: the same, in dark mode only
 * - \`rgb-companion\`: any theme key whose value starts with \`#\`
 */
export type HaComputed = "default-theme" | "default-theme-dark" | "rgb-companion";

/** One HA theme variable. Names are bare, without the prefix \`--\`. */
export interface HaVariable {
  readonly name: string;
  readonly tier: HaVariableTier;
  /** Default on \`html\`. \`null\` if only dark mode or apply time sets it. */
  readonly light: string | null;
  /** Dark-mode override. \`null\` if the light default applies in dark mode. */
  readonly dark: string | null;
  /** Variables named in a \`var()\` of \`light\` or \`dark\`, fallbacks included. */
  readonly references: readonly string[];
  /** \`path:line\` in the HA repo: the light declaration, else the first one. */
  readonly source: string;
  /** \`path:line\` of the dark override. */
  readonly darkSource: string | null;
  readonly computed: HaComputed | null;
}

export const HA_VARIABLES: readonly HaVariable[] = [
`;
for (const e of list) out += `  ${JSON.stringify(e)},\n`;
out += `];\n`;
writeFileSync(OUT, out);

const count = (tier) => list.filter((e) => e.tier === tier).length;
console.log(
  `ha-variables.ts: ${list.length} variables (core ${count("core")}, semantic ${count("semantic")}, component ${count("component")}) at ${sha}`,
);
