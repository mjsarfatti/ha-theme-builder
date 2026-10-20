/**
 * Public types for the theme engine.
 *
 * All types describe plain data. {@link ThemeConfig} is the shape the app
 * persists and puts in URLs, so it must survive a JSON round trip.
 */

/** A lowercase `#rrggbb` or `#rrggbbaa` color. */
export type Hex = string;

/** CSS custom properties keyed by the name that follows `--`. HA YAML uses the same keys. */
export type CssVarMap = Record<string, string>;

/** The 11 shades every Home Assistant color ramp is built from. */
export const RAMP_SLOTS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const;
export type RampSlot = (typeof RAMP_SLOTS)[number];

/** A full 05..95 ramp: slot number to `#rrggbb`. */
export type Ramp = Record<RampSlot, Hex>;

/** Neutral ramp slot names used in the config. */
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
 * Neutral slots available as card and page backgrounds.
 *
 * `neutral-100` is white (see {@link NeutralRampSlot}).
 */
export type SurfaceChoice = "neutral-100" | "neutral-95" | "neutral-90" | "neutral-80";

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
 * The 13 neutral ramp shades: the 11 {@link RampSlot} shades plus `0` and `100`.
 *
 * `.references/colors/black-white-ramps.html` has data for black (`0`) and
 * white (`100`). The four generated ramps use {@link RampSlot} (05 to 95).
 */
export const NEUTRAL_RAMP_SLOTS = [0, ...RAMP_SLOTS, 100] as const;
export type NeutralRampSlot = (typeof NEUTRAL_RAMP_SLOTS)[number];

/** A full 00..100 neutral ramp: slot number to `#rrggbb`. */
export type NeutralRamp = Record<NeutralRampSlot, Hex>;

export interface NeutralRampPreset {
  readonly id: NeutralRampId;
  /** Display label from the reference page. */
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

/** The 18 HA named colors (`--red-color` … `--blue-grey-color`). */
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

export type FontCategory = "sans" | "serif" | "display-serif" | "mono" | "system";

export interface FontOption {
  readonly id: string;
  /** Label for the font list, for example "DM Sans". */
  readonly label: string;
  readonly category: FontCategory;
  /** The complete CSS `font-family` value to emit. */
  readonly stack: string;
  /** `true` when the font needs an `extra_module_url` snippet, because HA bundles Roboto only. */
  readonly needsWebfont: boolean;
  /** Google Fonts family name. Set when {@link needsWebfont} is `true`. */
  readonly googleFontsFamily?: string;
  /** Weights the theme uses: body 400, heading 700, action 500. */
  readonly weights?: readonly number[];
}

export type FontId = string;

/**
 * A reference to a named palette color, for example `"palette:red"`.
 *
 * The reference resolves against the config `palette` field. It names a
 * static palette entry. A generated ramp (primary, red, orange, green)
 * grows from the seed fields, so a reference to it would be circular.
 */
export type PaletteRef = `palette:${PaletteColorName}`;

/** A literal color, or a reference that follows the palette preset. */
export type SeedColor = Hex | PaletteRef;

/** The user-facing knobs: the `KNOB` annotations in `.references/template.css`. */
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
    /** `--accent-color`, a single color. */
    readonly accent: SeedColor;
    /** `--info-color`, a single color. */
    readonly info: SeedColor;
  };

  readonly neutralRamp: NeutralRampId;
  readonly palette: ExtendedPaletteId;

  /**
   * Neutral slot for the border and divider color. The alpha is `1f`.
   *
   * `"match-card"` selects the `card-background-color` of each mode in place
   * of a slot (see `surfaces()` and `forMode()` in `derive.ts`).
   */
  readonly borderColor: NeutralSlotId | "match-card";
  readonly cardBackground: SurfaceChoice;
  readonly primaryBackground: SurfaceChoice;
}

/** A {@link ThemeConfig} with optional fields, for partial overrides. */
export type PartialThemeConfig = {
  -readonly [K in keyof ThemeConfig]?: K extends "fonts" | "colors"
    ? Partial<ThemeConfig[K]>
    : ThemeConfig[K];
};

export type ThemeMode = "light" | "dark";

/**
 * The engine output: three flat variable maps.
 *
 * `common` holds the variables that are the same in both modes. They become
 * the top-level YAML keys. `light` and `dark` hold the variables that differ
 * per mode. They become `modes.light` and `modes.dark`.
 */
export interface DerivedTheme {
  readonly config: ThemeConfig;
  readonly common: CssVarMap;
  readonly light: CssVarMap;
  readonly dark: CssVarMap;
  /** The generated ramps, for swatch rows. */
  readonly ramps: {
    readonly primary: Ramp;
    readonly red: Ramp;
    readonly orange: Ramp;
    readonly green: Ramp;
    readonly neutral: Ramp;
  };
  /** Fonts that need an `extra_module_url` loading snippet. */
  readonly webfonts: readonly FontOption[];
}
