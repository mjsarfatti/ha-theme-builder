/**
 * Theme engine: seed colors in, HA theme variables and YAML out.
 *
 * Do not import React or DOM APIs in `src/engine/`. `README.md` in this
 * directory describes the API.
 *
 * @example
 * const theme = derive({ colors: { primary: "#7c5cff" } });
 * const yaml = toYaml(theme);
 */

export { DEFAULT_CONFIG, derive, modeVars, resolveConfig, toCssProperties } from "./derive.ts";
export { toYaml, quoteYamlScalar, type ToYamlOptions } from "./yaml.ts";

export { generateRamp, rampEntries, type GenerateRampOptions } from "./ramps.ts";
export {
  alphaOf,
  hexToOklch,
  hexToRgb,
  isHex,
  normalizeHex,
  oklchToHex,
  opaqueHex,
  rgbToHex,
  rgbTriplet,
  withAlpha,
  type OklchColor,
  type Rgb255,
} from "./color.ts";
export {
  brighten,
  contrastingText,
  contrastRatio,
  darken,
  HA_CONTRAST_THRESHOLD,
  HA_DARK_INK,
  HA_LIGHT_INK,
  lab2rgb,
  labBrighten,
  labDarken,
  luminosity,
  rgb2lab,
  rgbContrast,
  type Lab,
} from "./ha-math.ts";

export {
  EXTENDED_PALETTES,
  FONT_CATEGORY_LABELS,
  FONTS,
  getExtendedPalette,
  getFont,
  getNeutralRamp,
  HA_GREEN_RAMP,
  HA_ORANGE_RAMP,
  HA_PRIMARY_RAMP,
  HA_RED_RAMP,
  KNOB_SLOT,
  NEUTRAL_RAMPS,
  PALETTE_COLOR_NAMES,
  REFERENCE_RAMPS,
} from "./presets/index.ts";

export {
  RAMP_SLOTS,
  type CssVarMap,
  type DerivedTheme,
  type ExtendedPaletteId,
  type ExtendedPalettePreset,
  type FontCategory,
  type FontId,
  type FontOption,
  type Hex,
  type NeutralRampId,
  type NeutralRampPreset,
  type NeutralSlotId,
  type PaletteColorName,
  type PartialThemeConfig,
  type Ramp,
  type RampSlot,
  type SurfaceChoice,
  type ThemeConfig,
  type ThemeMode,
} from "./types.ts";
