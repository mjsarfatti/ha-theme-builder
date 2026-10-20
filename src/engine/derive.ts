/**
 * Derives the HA variable maps for light and dark mode from a theme config.
 *
 * `KNOB` variables of `.references/template.css` come from the config.
 * `DERIVED` variables follow the `NOTE:` on their line. `README.md` lists
 * the variables where the engine differs from `template.css`.
 */
import { normalizeHex, rgbTriplet, withAlpha } from "./color.ts";
import { contrastingText } from "./ha-math.ts";
import {
  getExtendedPalette,
  getFont,
  getNeutralRamp,
  KNOB_SLOT,
  PALETTE_COLOR_NAMES,
  REFERENCE_RAMPS,
} from "./presets/index.ts";
import { generateRamp } from "./ramps.ts";
import {
  NEUTRAL_RAMP_SLOTS,
  RAMP_SLOTS,
  type CssVarMap,
  type DerivedTheme,
  type FontOption,
  type Hex,
  type NeutralRamp,
  type NeutralRampSlot,
  type NeutralSlotId,
  type PaletteColorName,
  type PartialThemeConfig,
  type Ramp,
  type RampSlot,
  type SeedColor,
  type SurfaceChoice,
  type ThemeConfig,
  type ThemeMode,
} from "./types.ts";

/**
 * The default config, "Home Assistant Refined" (`template.css`).
 *
 * It differs from the stock HA theme: off-ramp stock values sit on the
 * ramps. For example, `--primary-background-color` is `neutral-95`.
 */
export const DEFAULT_CONFIG: ThemeConfig = {
  name: "My Theme",
  fonts: {
    body: "roboto",
    heading: "roboto",
    longform: "system-sans",
    code: "system-mono",
  },
  colors: {
    primary: "#009ac7", // --ha-color-primary-40
    error: "#dc3146", // --ha-color-red-50
    warning: "#ff9342", // --ha-color-orange-70
    success: "#00ac49", // --ha-color-green-60
    accent: "#ff9800",
    info: "#039be5",
  },
  neutralRamp: "ha",
  palette: "ha",
  borderColor: "neutral-05",
  cardBackground: "neutral-100",
  primaryBackground: "neutral-95",
};

/** Fills a partial config in from {@link DEFAULT_CONFIG}. */
export function resolveConfig(partial: PartialThemeConfig = {}): ThemeConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
    fonts: { ...DEFAULT_CONFIG.fonts, ...partial.fonts },
    colors: { ...DEFAULT_CONFIG.colors, ...partial.colors },
  };
}

const WHITE: Hex = "#ffffff";

function slotOf(id: NeutralSlotId): NeutralRampSlot {
  return Number(id.slice("neutral-".length)) as NeutralRampSlot;
}

/**
 * Returns the dark-mode counterpart of a slot: `100 - slot`.
 *
 * Both slot types are symmetric about 50: 05 maps to 95 and 50 maps to
 * itself. HA's `darkSemanticColorStyles` inverts surface and border
 * tokens the same way.
 */
function mirrorSlot<S extends RampSlot | NeutralRampSlot>(slot: S): S {
  return (100 - slot) as S;
}

const SLOT_ORDER: readonly RampSlot[] = RAMP_SLOTS;

/**
 * Returns the neutral ramp color at a position in `NEUTRAL_RAMP_SLOTS`.
 *
 * Positions outside the list clamp to the first or last slot. The module
 * exports it for `derive.test.ts` only.
 */
export function neutralRampAt(ramp: NeutralRamp, index: number): Hex {
  const i = Math.min(NEUTRAL_RAMP_SLOTS.length - 1, Math.max(0, index));
  return ramp[NEUTRAL_RAMP_SLOTS[i]];
}

/** The last valid index into {@link NEUTRAL_RAMP_SLOTS}. */
const LAST_NEUTRAL_INDEX = NEUTRAL_RAMP_SLOTS.length - 1;

/** Mirrors a position in {@link NEUTRAL_RAMP_SLOTS}. Callers clamp with {@link neutralRampAt}. */
function mirrorNeutralIndex(index: number): number {
  return LAST_NEUTRAL_INDEX - index;
}

/** Position of each background choice in {@link NEUTRAL_RAMP_SLOTS}. */
const SURFACE_INDEX: Record<SurfaceChoice, number> = {
  "neutral-100": NEUTRAL_RAMP_SLOTS.indexOf(100),
  "neutral-95": NEUTRAL_RAMP_SLOTS.indexOf(95),
  "neutral-90": NEUTRAL_RAMP_SLOTS.indexOf(90),
  "neutral-80": NEUTRAL_RAMP_SLOTS.indexOf(80),
};

interface Surfaces {
  card: Hex;
  page: Hex;
  secondary: Hex;
}

/**
 * Returns the card, page and secondary backgrounds for one mode.
 *
 * Dark mode keeps the light-mode order and gap of card and page, as HA
 * does (`color.globals.ts:46-47`, `:342-343`).
 *
 * `--secondary-background-color` is one position below the darker surface
 * in light mode and two above the page in dark mode.
 */
function surfaces(config: ThemeConfig, neutral: NeutralRamp, mode: ThemeMode): Surfaces {
  const cardIndex = SURFACE_INDEX[config.cardBackground];
  const pageIndex = SURFACE_INDEX[config.primaryBackground];

  if (mode === "light") {
    return {
      card: neutralRampAt(neutral, cardIndex),
      page: neutralRampAt(neutral, pageIndex),
      // One step below the darker surface.
      secondary: neutralRampAt(neutral, Math.min(cardIndex, pageIndex) - 1),
    };
  }

  const darkerIndex = Math.min(cardIndex, pageIndex);
  const lighterIndex = Math.max(cardIndex, pageIndex);
  const gap = lighterIndex - darkerIndex;
  const anchor = mirrorNeutralIndex(darkerIndex);
  const other = anchor + gap;

  // The surface that is darker in light mode takes the anchor.
  const darkCardIndex = cardIndex <= pageIndex ? anchor : other;
  const darkPageIndex = pageIndex <= cardIndex ? anchor : other;

  return {
    card: neutralRampAt(neutral, darkCardIndex),
    page: neutralRampAt(neutral, darkPageIndex),
    // HA dark order: page #111111 < card #1c1c1c < secondary #282828.
    secondary: neutralRampAt(neutral, Math.max(darkPageIndex + 2, darkCardIndex + 1)),
  };
}

interface ShadowLayer {
  /** Offset, blur and spread, as in `template.css`. */
  geometry: string;
  /** Light-mode alpha, 0..1. */
  alpha: number;
}

const SHADOWS: Record<"s" | "m" | "l", readonly ShadowLayer[]> = {
  s: [
    { geometry: "0 1px 2px 0", alpha: 0x14 / 255 },
    { geometry: "0 1px 3px 0", alpha: 0x1f / 255 },
  ],
  m: [
    { geometry: "0 3px 6px -1px", alpha: 0x1a / 255 },
    { geometry: "0 8px 16px -2px", alpha: 0x26 / 255 },
  ],
  l: [
    { geometry: "0 6px 12px -3px", alpha: 0x1f / 255 },
    { geometry: "0 16px 32px -6px", alpha: 0x33 / 255 },
  ],
};

/**
 * HA dark-mode alpha of the first layer of each shadow.
 *
 * The second layer scales by the same factor.
 */
const DARK_SHADOW_FIRST_ALPHA: Record<"s" | "m" | "l", number> = {
  s: 0.4,
  m: 0.35,
  l: 0.4,
};

function shadow(size: "s" | "m" | "l", base: Hex, mode: ThemeMode): string {
  const layers = SHADOWS[size];
  const scale =
    mode === "dark" ? DARK_SHADOW_FIRST_ALPHA[size] / layers[0].alpha : 1;
  return layers
    .map((layer) => `${layer.geometry} ${withAlpha(base, Math.min(1, layer.alpha * scale))}`)
    .join(", ");
}

/** Light-mode input alphas, as in `template.css`. */
const INPUT_ALPHA = {
  "input-idle-line-color": "6b",
  "input-hover-line-color": "de",
  "input-disabled-line-color": "0f",
  "input-outlined-idle-border-color": "61",
  "input-outlined-hover-border-color": "de",
  "input-outlined-disabled-border-color": "0f",
  "input-ink-color": "de",
  "input-label-ink-color": "99", // `template.css` writes `#0009`
  "input-disabled-ink-color": "5e",
  "input-dropdown-icon-color": "8a",
} as const;

/**
 * The neutral slots of the three text roles in one mode.
 *
 * Light mode follows `template.css`. Dark mode follows the HA overrides:
 * white primary text and neutral-80 secondary text.
 *
 * Dark disabled text uses neutral-50. The mirror of 60, neutral-40, gives
 * 2.1:1 on a dark card, against 3.0:1 in light mode.
 */
interface TextSlots {
  /** `null` is pure white, the HA dark-mode override. */
  primary: RampSlot | null;
  secondary: RampSlot;
  disabled: RampSlot;
}

const TEXT_SLOTS: Record<ThemeMode, TextSlots> = {
  light: { primary: 5, secondary: 40, disabled: 60 },
  dark: { primary: null, secondary: 80, disabled: 50 },
};

const PALETTE_REF_PREFIX = "palette:";

/** Returns `true` for a `palette:${PaletteColorName}` reference. */
function isPaletteRef(seed: SeedColor): seed is `palette:${PaletteColorName}` {
  return seed.startsWith(PALETTE_REF_PREFIX);
}

/**
 * Resolves a seed color to a literal hex.
 *
 * A `palette:<name>` reference reads the color of the current `palette`
 * preset, so the seed follows later preset changes. A malformed string
 * throws, as in `getFont` and `getNeutralRamp`.
 *
 * @throws {RangeError} when the palette lacks that color name.
 */
function resolveSeed(seed: SeedColor, palette: Record<PaletteColorName, Hex>): Hex {
  if (!isPaletteRef(seed)) return seed;
  const name = seed.slice(PALETTE_REF_PREFIX.length) as PaletteColorName;
  const hex = palette[name];
  if (!hex) throw new RangeError(`Unknown palette colour reference: ${JSON.stringify(seed)}`);
  return hex;
}

/**
 * Maps a knob config to the full set of Home Assistant theme variables.
 *
 * @throws {TypeError} on a malformed seed color
 * @throws {RangeError} on an unknown font / ramp / palette id
 */
export function derive(input: PartialThemeConfig | ThemeConfig = {}): DerivedTheme {
  const config = resolveConfig(input as PartialThemeConfig);

  // Presets first: seeds need the palette and surfaces need the 00..100 neutral ramp.
  const neutralExtended = getNeutralRamp(config.neutralRamp).ramp;
  const neutral: Ramp = Object.fromEntries(
    RAMP_SLOTS.map((s) => [s, neutralExtended[s]]),
  ) as Ramp;
  const palette = getExtendedPalette(config.palette).colors;

  const seed = {
    primary: resolveSeed(config.colors.primary, palette),
    error: resolveSeed(config.colors.error, palette),
    warning: resolveSeed(config.colors.warning, palette),
    success: resolveSeed(config.colors.success, palette),
    accent: resolveSeed(config.colors.accent, palette),
    info: resolveSeed(config.colors.info, palette),
  };

  const primary = generateRamp({
    seed: seed.primary,
    slot: KNOB_SLOT.primary,
    reference: REFERENCE_RAMPS.primary,
  });
  const red = generateRamp({
    seed: seed.error,
    slot: KNOB_SLOT.red,
    reference: REFERENCE_RAMPS.red,
  });
  const orange = generateRamp({
    seed: seed.warning,
    slot: KNOB_SLOT.orange,
    reference: REFERENCE_RAMPS.orange,
  });
  const green = generateRamp({
    seed: seed.success,
    slot: KNOB_SLOT.green,
    reference: REFERENCE_RAMPS.green,
  });

  const accent = normalizeHex(seed.accent);
  const info = normalizeHex(seed.info);

  const fonts = {
    body: getFont(config.fonts.body),
    heading: getFont(config.fonts.heading),
    longform: getFont(config.fonts.longform),
    code: getFont(config.fonts.code),
  };

  const common: CssVarMap = {};

  common["ha-font-size-scale"] = "1";
  common["ha-font-family-body"] = fonts.body.stack;
  common["ha-font-family-code"] = fonts.code.stack;
  common["ha-font-family-longform"] = fonts.longform.stack;
  common["ha-font-family-heading"] = fonts.heading.stack;
  common["ha-font-weight-body"] = "400";
  common["ha-font-weight-heading"] = "700";
  common["ha-font-weight-action"] = "500";

  for (const [name, ramp] of [
    ["primary", primary],
    ["orange", orange],
    ["red", red],
    ["green", green],
    ["neutral", neutral],
  ] as const) {
    for (const slot of SLOT_ORDER) {
      common[`ha-color-${name}-${String(slot).padStart(2, "0")}`] = ramp[slot];
    }
  }

  for (const name of PALETTE_COLOR_NAMES) {
    common[`${name}-color`] = palette[name];
  }

  common["light-grey-color"] = neutral[70];
  common["grey-color"] = neutral[60];
  common["dark-grey-color"] = neutral[50];

  // Ramp slots, as in `template.css`. HA's Lab brighten/darken skips YAML themes.
  common["primary-color"] = primary[KNOB_SLOT.primary];
  common["dark-primary-color"] = primary[30];
  common["darker-primary-color"] = primary[20];
  common["light-primary-color"] = primary[50];

  // HA's contrast rule (`apply_themes_on_element.ts:91`) sets text on the
  // primary and accent colors to `#ffffff` or `#212121`
  // (`color.globals.ts:10-11`).
  common["text-primary-color"] = contrastingText(primary[KNOB_SLOT.primary]);
  common["text-light-primary-color"] = contrastingText(primary[50]);
  common["accent-color"] = accent;
  common["text-accent-color"] = contrastingText(accent);

  common["error-color"] = red[KNOB_SLOT.red];
  common["warning-color"] = orange[KNOB_SLOT.orange];
  common["success-color"] = green[KNOB_SLOT.green];
  common["info-color"] = info;

  common["label-badge-grey"] = neutral[60];

  // Fixed values, as in `template.css`.
  common["energy-grid-consumption-color"] = "#488fc2";
  common["energy-grid-return-color"] = "#8353d1";
  common["energy-solar-color"] = "#ff9800";
  common["energy-non-fossil-color"] = "#0f9d58";
  common["energy-battery-out-color"] = "#4db6ac";
  common["energy-battery-in-color"] = "#f06292";
  common["energy-gas-color"] = "#8e021b";
  common["energy-water-color"] = "#00bcd4";

  common["rgb-primary-color"] = rgbTriplet(common["primary-color"]);
  common["rgb-accent-color"] = rgbTriplet(accent);
  common["rgb-text-primary-color"] = rgbTriplet(common["text-primary-color"]);
  common["rgb-warning-color"] = rgbTriplet(common["warning-color"]);
  common["rgb-error-color"] = rgbTriplet(common["error-color"]);
  common["rgb-success-color"] = rgbTriplet(common["success-color"]);
  common["rgb-info-color"] = rgbTriplet(info);

  const forMode = (mode: ThemeMode): CssVarMap => {
    const vars: CssVarMap = {};
    const dark = mode === "dark";

    // Base of the derivations that `template.css` writes on 000000.
    const inkBase = dark ? neutral[mirrorSlot(5)] : neutral[5];

    // The shadow base stays dark in both modes. Only the opacity grows.
    for (const size of ["s", "m", "l"] as const) {
      vars[`ha-box-shadow-${size}`] = shadow(size, neutral[5], mode);
    }

    for (const [key, alpha] of Object.entries(INPUT_ALPHA)) {
      vars[key] = withAlpha(inkBase, alpha);
    }
    // Fills sit recessed in light mode and raised in dark mode, as in HA.
    vars["input-fill-color"] = dark ? neutral[20] : neutral[95];
    vars["input-disabled-fill-color"] = dark ? neutral[30] : neutral[90];

    const slots = TEXT_SLOTS[mode];
    vars["primary-text-color"] = slots.primary === null ? WHITE : neutral[slots.primary];
    vars["secondary-text-color"] = neutral[slots.secondary];
    vars["disabled-text-color"] = neutral[slots.disabled];
    vars["disabled-color"] = vars["disabled-text-color"];

    // Before the border: a `"match-card"` border reads this card color.
    const surface = surfaces(config, neutralExtended, mode);
    vars["card-background-color"] = surface.card;
    vars["primary-background-color"] = surface.page;
    vars["secondary-background-color"] = surface.secondary;
    vars["clear-background-color"] = surface.card;

    // `"match-card"` uses this mode's card color. A mirrored light slot is
    // wrong here, because `surfaces()` derives the dark card from both
    // surface knobs.
    const borderBase: Hex =
      config.borderColor === "match-card"
        ? surface.card
        : neutralExtended[
            dark ? mirrorSlot(slotOf(config.borderColor)) : slotOf(config.borderColor)
          ];
    vars["divider-color"] = withAlpha(borderBase, "1f");
    vars["outline-color"] = vars["divider-color"];
    vars["outline-hover-color"] = withAlpha(borderBase, "3d");
    // The Lines NOTE (`template.css:144`) puts the shadow on neutral-05.
    // The shadow ignores the border knob, because a "match-card" border
    // would hide it. Dark alpha 7a is HA's `rgba(0, 0, 0, 0.48)`.
    vars["shadow-color"] = withAlpha(neutral[5], dark ? "7a" : "29");

    vars["scrollbar-thumb-color"] = neutral[dark ? mirrorSlot(70) : 70];

    // Mirrored in dark mode so the icon stays readable on the surface.
    vars["state-icon-color"] = primary[dark ? mirrorSlot(30) : 30];

    vars["rgb-primary-text-color"] = rgbTriplet(vars["primary-text-color"]);
    vars["rgb-secondary-text-color"] = rgbTriplet(vars["secondary-text-color"]);
    vars["rgb-card-background-color"] = rgbTriplet(vars["card-background-color"]);

    return vars;
  };

  const seen = new Set<string>();
  const webfonts: FontOption[] = [];
  for (const font of [fonts.body, fonts.heading, fonts.longform, fonts.code]) {
    if (font.needsWebfont && !seen.has(font.id)) {
      seen.add(font.id);
      webfonts.push(font);
    }
  }

  return {
    config,
    common,
    light: forMode("light"),
    dark: forMode("dark"),
    ramps: { primary, red, orange, green, neutral },
    webfonts,
  };
}

/** Returns the `common` variables merged with the variables of one mode. */
export function modeVars(theme: DerivedTheme, mode: ThemeMode): CssVarMap {
  return { ...theme.common, ...theme[mode] };
}

/**
 * Returns {@link modeVars} keyed by CSS property name (`--primary-color`).
 *
 * Use it with `element.style.setProperty()` on a scoped preview container.
 */
export function toCssProperties(theme: DerivedTheme, mode: ThemeMode): CssVarMap {
  return Object.fromEntries(
    Object.entries(modeVars(theme, mode)).map(([k, v]) => [`--${k}`, v]),
  );
}
