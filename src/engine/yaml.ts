/**
 * Variable maps → a paste-ready Home Assistant YAML theme.
 *
 * Hand-built rather than `js-yaml`, for three reasons the analysis doc makes
 * unavoidable (`ha_theme_analysis.md` §4, §5.5):
 *
 * 1. **Every value must be quoted.** `primary-color: #009ac7` is not "a hex
 *    value" to a YAML parser — the `#` opens a comment and the key ends up
 *    empty. A generic serializer quotes only when it must; we always quote.
 * 2. **`rgb-*` companions must be omitted where HA derives them itself.**
 *    `processTheme()` auto-generates `--rgb-{key}` for any value starting with
 *    `#`, so emitting them is noise that can drift out of sync.
 * 3. **The output is meant to be read.** It is grouped and commented the way
 *    `template.css` is, because a user is going to paste it into their config
 *    and want to understand what they pasted.
 */
import type { CssVarMap, DerivedTheme, ThemeMode } from "./types.ts";

export interface ToYamlOptions {
  /** Theme name (the YAML key). Defaults to the config's `name`. */
  name?: string;
  /**
   * `"none"` (default) emits `<name>:` at the top level, for a `themes.yaml`
   * pulled in with `frontend: themes: !include themes.yaml`.
   * `"frontend"` wraps it in `frontend: themes:` for pasting straight into
   * `configuration.yaml`.
   */
  wrapper?: "none" | "frontend";
  /** Prepend the provenance header comment. Default `true`. */
  header?: boolean;
  /** Emit the section comments. Default `true`. */
  comments?: boolean;
}

/**
 * Section headings and their keys, in emission order. Mirrors the grouping in
 * `.references/template.css` so the two can be read side by side.
 */
const GROUPS: readonly { title: string; keys: readonly string[] }[] = [
  {
    title: "Typography",
    keys: [
      "ha-font-size-scale",
      "ha-font-family-body",
      "ha-font-family-heading",
      "ha-font-family-longform",
      "ha-font-family-code",
      "ha-font-weight-body",
      "ha-font-weight-heading",
      "ha-font-weight-action",
    ],
  },
  { title: "Box shadows", keys: ["ha-box-shadow-s", "ha-box-shadow-m", "ha-box-shadow-l"] },
  {
    title: "Inputs",
    keys: [
      "input-idle-line-color",
      "input-hover-line-color",
      "input-disabled-line-color",
      "input-outlined-idle-border-color",
      "input-outlined-hover-border-color",
      "input-outlined-disabled-border-color",
      "input-fill-color",
      "input-disabled-fill-color",
      "input-ink-color",
      "input-label-ink-color",
      "input-disabled-ink-color",
      "input-dropdown-icon-color",
    ],
  },
  { title: "Primary ramp", keys: ramp("primary") },
  { title: "Orange ramp (warning)", keys: ramp("orange") },
  { title: "Red ramp (error)", keys: ramp("red") },
  { title: "Green ramp (success)", keys: ramp("green") },
  { title: "Neutral ramp", keys: ramp("neutral") },
  {
    title: "Extended palette",
    keys: [
      "red-color",
      "pink-color",
      "purple-color",
      "deep-purple-color",
      "indigo-color",
      "blue-color",
      "light-blue-color",
      "cyan-color",
      "teal-color",
      "green-color",
      "light-green-color",
      "lime-color",
      "yellow-color",
      "amber-color",
      "orange-color",
      "deep-orange-color",
      "brown-color",
      "blue-grey-color",
      "light-grey-color",
      "grey-color",
      "dark-grey-color",
      "label-badge-grey",
    ],
  },
  {
    title: "Text",
    keys: [
      "primary-text-color",
      "secondary-text-color",
      "disabled-text-color",
      "text-primary-color",
      "text-light-primary-color",
      "text-accent-color",
      "disabled-color",
    ],
  },
  {
    title: "Brand and status",
    keys: [
      "primary-color",
      "dark-primary-color",
      "darker-primary-color",
      "light-primary-color",
      "accent-color",
      "error-color",
      "warning-color",
      "success-color",
      "info-color",
      "state-icon-color",
    ],
  },
  {
    title: "Lines and shadows",
    keys: [
      "divider-color",
      "outline-color",
      "outline-hover-color",
      "shadow-color",
      "scrollbar-thumb-color",
    ],
  },
  {
    title: "Backgrounds",
    keys: [
      "card-background-color",
      "primary-background-color",
      "secondary-background-color",
      "clear-background-color",
    ],
  },
  {
    title: "Energy",
    keys: [
      "energy-grid-consumption-color",
      "energy-grid-return-color",
      "energy-solar-color",
      "energy-non-fossil-color",
      "energy-battery-out-color",
      "energy-battery-in-color",
      "energy-gas-color",
      "energy-water-color",
    ],
  },
  {
    title: "RGB companions (only where HA cannot derive them)",
    keys: [
      "rgb-primary-color",
      "rgb-accent-color",
      "rgb-primary-text-color",
      "rgb-secondary-text-color",
      "rgb-text-primary-color",
      "rgb-card-background-color",
      "rgb-warning-color",
      "rgb-error-color",
      "rgb-success-color",
      "rgb-info-color",
    ],
  },
];

function ramp(name: string): string[] {
  return [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95].map(
    (s) => `ha-color-${name}-${String(s).padStart(2, "0")}`,
  );
}

/**
 * Quotes a scalar so YAML reads it back as the literal string.
 *
 * Double quotes by default; single quotes when the value already contains
 * double quotes (font stacks such as `"DM Sans", Roboto, …`), which keeps the
 * output readable instead of a thicket of backslashes.
 */
export function quoteYamlScalar(value: string): string {
  if (value.includes('"') && !value.includes("'")) {
    return `'${value}'`;
  }
  if (value.includes('"')) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `"${value.replace(/\\/g, "\\\\")}"`;
}

/**
 * `true` when Home Assistant will generate `--rgb-<base>` itself, so we must
 * not emit it. `processTheme()` does this for any value starting with `#`
 * (§4.1 step 5) — the "hex only" rule of §5.5.
 */
function haDerivesRgb(key: string, resolved: CssVarMap): boolean {
  if (!key.startsWith("rgb-")) return false;
  const base = resolved[key.slice("rgb-".length)];
  return base !== undefined && base.startsWith("#");
}

interface Line {
  key: string;
  value: string;
}

function emit(
  lines: readonly (Line | { comment: string })[],
  indent: string,
  comments: boolean,
): string[] {
  const out: string[] = [];
  for (const line of lines) {
    if ("comment" in line) {
      if (comments) {
        if (out.length > 0) out.push("");
        out.push(`${indent}# ${line.comment}`);
      }
      continue;
    }
    out.push(`${indent}${line.key}: ${quoteYamlScalar(line.value)}`);
  }
  return out;
}

/** Orders and groups one variable map, dropping HA-derivable rgb companions. */
function groupedLines(
  vars: CssVarMap,
  resolved: CssVarMap,
): (Line | { comment: string })[] {
  const remaining = new Set(Object.keys(vars));
  const lines: (Line | { comment: string })[] = [];

  for (const group of GROUPS) {
    const present = group.keys.filter(
      (k) => remaining.has(k) && !haDerivesRgb(k, resolved),
    );
    for (const key of group.keys) remaining.delete(key);
    if (present.length === 0) continue;
    lines.push({ comment: group.title });
    for (const key of present) lines.push({ key, value: vars[key] });
  }

  // Anything the grouping does not know about still gets emitted, so a new
  // variable can never silently vanish from the export.
  const leftovers = [...remaining].filter((k) => !haDerivesRgb(k, resolved)).sort();
  if (leftovers.length > 0) {
    lines.push({ comment: "Other" });
    for (const key of leftovers) lines.push({ key, value: vars[key] });
  }
  return lines;
}

const MODE_NOTE: Record<ThemeMode, string> = {
  light: "Light mode",
  dark: "Dark mode",
};

/**
 * Serialises a derived theme.
 *
 * Mode-independent variables become top-level keys; everything that differs by
 * mode goes under `modes.light` / `modes.dark`. Defining both modes is what
 * lets the user toggle in their profile (`ha_theme_analysis.md` §5.4).
 */
export function toYaml(theme: DerivedTheme, options: ToYamlOptions = {}): string {
  const {
    name = theme.config.name,
    wrapper = "none",
    header = true,
    comments = true,
  } = options;

  const base = wrapper === "frontend" ? "    " : "  ";
  const pad = (extra: number) => base + "  ".repeat(extra);

  const out: string[] = [];

  if (header) {
    out.push(
      "# Generated by HA Theme Builder.",
      "# Paste into your themes file, then pick the theme in Profile → Themes.",
      "# rgb-* companions are omitted wherever Home Assistant derives them from a",
      "# hex value automatically; the few that remain are listed explicitly.",
    );
    if (theme.webfonts.length > 0) {
      out.push(
        "#",
        `# This theme uses ${theme.webfonts.map((f) => f.label).join(", ")}, which Home`,
        "# Assistant does not ship (it bundles Roboto only). A theme can name a font",
        "# but cannot load one, so pair this with the extra_module_url loader snippet.",
      );
    }
    out.push("");
  }

  if (wrapper === "frontend") {
    out.push("frontend:", "  themes:");
    out.push(`    ${name}:`);
  } else {
    out.push(`${name}:`);
  }

  const commonIndent = wrapper === "frontend" ? pad(1) : "  ";
  out.push(...emit(groupedLines(theme.common, theme.common), commonIndent, comments));

  out.push("");
  out.push(`${commonIndent}modes:`);
  for (const mode of ["light", "dark"] as const) {
    const resolved = { ...theme.common, ...theme[mode] };
    out.push("");
    if (comments) out.push(`${commonIndent}  # ${MODE_NOTE[mode]}`);
    out.push(`${commonIndent}  ${mode}:`);
    out.push(...emit(groupedLines(theme[mode], resolved), `${commonIndent}    `, comments));
  }

  return `${out.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}
