/**
 * Public types for the theme engine.
 *
 * Everything here is plain data: the engine has no React, no DOM and no I/O.
 * The shape of {@link ThemeConfig} is frozen at the end of M1 — it is also the
 * shape the app persists / URL-serializes, so keep it JSON-round-trippable.
 */

/** A `#rrggbb` or `#rrggbbaa` colour, always lowercase and fully expanded. */
export type Hex = string;

/**
 * A map of CSS custom properties keyed by their **bare** name (no `--`
 * prefix) — the same spelling Home Assistant expects in YAML.
 */
export type CssVarMap = Record<string, string>;

/** The 11 shades every Home Assistant colour ramp is built from. */
export const RAMP_SLOTS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const;
export type RampSlot = (typeof RAMP_SLOTS)[number];

/** A full 05..95 ramp. Keys are slot numbers, values are `#rrggbb`. */
export type Ramp = Record<RampSlot, Hex>;

/** Named neutral slots, as referenced from the knob config. */
export type NeutralSlotId =
  | "neutral-00"
  | "neutral-05"
  | "neutral-10"
  | "neutral-20"
  | "neutral-30"
  | "neutral-40"
  | "neutral-50"
  | "neutral-60"
  | "neutral-70"
  | "neutral-80"
  | "neutral-90"
  | "neutral-95"
  | "neutral-100";

/**
 * Surfaces the user may pick for card / page backgrounds.
 * Per `template.css`: "user can choose from Neutral Ramp 80, 90, 95 + white" —
 * "white" is `neutral-100`, the ramp's own light extreme (see
 * {@link NeutralRampSlot}), not a value outside it.
 */
export type SurfaceChoice = "neutral-100" | "neutral-95" | "neutral-90" | "neutral-80";

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export type NeutralRampId =
  | "ha"
  | "rounded"
  | "slate"
  | "gray"
  | "zinc"
  | "stone"
  | "mauve"
  | "olive"
  | "mist"
  | "taupe";

/**
 * The 13 shades the neutral ramp ships, unlike the 11-shade {@link RampSlot}
 * that primary/red/orange/green share. `.references/colors/black-white-ramps.html`
 * carries real reference data at pure black (`0`) and pure white (`100`) for
 * every preset column — those two rows are what let a "white" or "black"
 * knob option be expressed as a ramp slot rather than a special case. This is
 * deliberately its own type, not an extension of {@link RampSlot}: the other
 * four ramps are generated (`generateRamp()`) and have no reference data at
 * those extremes, so sharing the type would force a `Record<RampSlot, Hex>`
 * like `HA_PRIMARY_RAMP` to also carry slots it cannot supply.
 */
export const NEUTRAL_RAMP_SLOTS = [0, ...RAMP_SLOTS, 100] as const;
export type NeutralRampSlot = (typeof NEUTRAL_RAMP_SLOTS)[number];

/** A full 00..100 neutral ramp. Keys are slot numbers, values are `#rrggbb`. */
export type NeutralRamp = Record<NeutralRampSlot, Hex>;

export interface NeutralRampPreset {
  readonly id: NeutralRampId;
  /** Display label, verbatim from the reference page. */
  readonly label: string;
  readonly ramp: NeutralRamp;
}

export type ExtendedPaletteId =
  | "ha"
  | "tailwind-v3"
  | "tailwind-v4"
  | "material-accent"
  | "ant-design"
  | "chakra-ui"
  | "bulma"
  | "rounded";

/** The 18 HA named colours (`--red-color` … `--blue-grey-color`). */
export type PaletteColorName =
  | "red"
  | "pink"
  | "purple"
  | "deep-purple"
  | "indigo"
  | "blue"
  | "light-blue"
  | "cyan"
  | "teal"
  | "green"
  | "light-green"
  | "lime"
  | "yellow"
  | "amber"
  | "orange"
  | "deep-orange"
  | "brown"
  | "blue-grey";

export interface ExtendedPalettePreset {
  readonly id: ExtendedPaletteId;
  readonly label: string;
  readonly colors: Record<PaletteColorName, Hex>;
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

export type FontCategory = "sans" | "serif" | "display-serif" | "mono" | "system";

export interface FontOption {
  readonly id: string;
  /** Human label for the dropdown, e.g. "DM Sans". */
  readonly label: string;
  readonly category: FontCategory;
  /** The complete CSS `font-family` value to emit. */
  readonly stack: string;
  /**
   * `true` when Home Assistant does not ship this face and the export step must
   * emit an `extra_module_url` web-font loading snippet. HA bundles Roboto only.
   */
  readonly needsWebfont: boolean;
  /** Google Fonts family name, present iff {@link needsWebfont}. */
  readonly googleFontsFamily?: string;
  /** Weights the theme actually uses (body/heading/action are 400/700/500). */
  readonly weights?: readonly number[];
}

export type FontId = string;

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/**
 * A reference to one of the 18 named entity-palette colours (`"palette:red"`),
 * resolved against the config's own `palette` field. Reuses
 * {@link PaletteColorName} rather than a new union.
 *
 * Deliberately **not** a reference to a generated ramp (primary, red, orange,
 * green): those four ramps are generated *from* these same seed fields, so a
 * reference into one of them would have no fixed point to resolve to before
 * the ramp exists. `PaletteColorName` names only the static entity palette,
 * so this union cannot express that cycle — the constraint is structural, not
 * a runtime check.
 */
export type PaletteRef = `palette:${PaletteColorName}`;

/** Either a literal colour, or a reference that follows a palette preset. */
export type SeedColor = Hex | PaletteRef;

/**
 * The complete set of user-facing knobs — exactly the `KNOB` annotations in
 * `.references/template.css`, minus the "custom" preset options that PLAN.md
 * §3 decision 6 defers to M7.
 */
export interface ThemeConfig {
  /** YAML key the theme is emitted under. */
  readonly name: string;

  readonly fonts: {
    /** `--ha-font-family-body` */
    readonly body: FontId;
    /** `--ha-font-family-heading` */
    readonly heading: FontId;
    /** `--ha-font-family-longform` */
    readonly longform: FontId;
    /** `--ha-font-family-code` */
    readonly code: FontId;
  };

  readonly colors: {
    /** Seed for `--ha-color-primary-40`. */
    readonly primary: SeedColor;
    /** Seed for `--ha-color-red-50` (→ `--error-color`). */
    readonly error: SeedColor;
    /** Seed for `--ha-color-orange-70` (→ `--warning-color`). */
    readonly warning: SeedColor;
    /** Seed for `--ha-color-green-60` (→ `--success-color`). */
    readonly success: SeedColor;
    /** `--accent-color`, standalone (no ramp in HA). */
    readonly accent: SeedColor;
    /** `--info-color`, standalone (no ramp in HA). */
    readonly info: SeedColor;
  };

  readonly neutralRamp: NeutralRampId;
  readonly palette: ExtendedPaletteId;

  /**
   * Neutral slot the border/divider colour is taken from (alpha stays `1f`),
   * or `"match-card"` — a sentinel, not a colour — to resolve to the current
   * mode's own `card-background-color` instead. See `derive.ts`'s `surfaces()`
   * and the border-base resolution in `forMode()`.
   */
  readonly borderColor: NeutralSlotId | "match-card";
  readonly cardBackground: SurfaceChoice;
  readonly primaryBackground: SurfaceChoice;
}

/** A config where every field is optional, for partial overrides. */
export type PartialThemeConfig = {
  -readonly [K in keyof ThemeConfig]?: K extends "fonts" | "colors"
    ? Partial<ThemeConfig[K]>
    : ThemeConfig[K];
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export type ThemeMode = "light" | "dark";

/**
 * The engine's output: three flat variable maps.
 *
 * `common` holds the mode-independent variables (they become the top-level YAML
 * keys); `light` and `dark` hold only the variables that differ per mode and
 * become the `modes.light` / `modes.dark` blocks. Use {@link modeVars} to get a
 * single fully-resolved map for one mode.
 */
export interface DerivedTheme {
  readonly config: ThemeConfig;
  readonly common: CssVarMap;
  readonly light: CssVarMap;
  readonly dark: CssVarMap;
  /** The generated ramps, exposed so the preview can render swatch rows. */
  readonly ramps: {
    readonly primary: Ramp;
    readonly red: Ramp;
    readonly orange: Ramp;
    readonly green: Ramp;
    readonly neutral: Ramp;
  };
  /** Fonts that require an `extra_module_url` loading snippet (M6). */
  readonly webfonts: readonly FontOption[];
}
