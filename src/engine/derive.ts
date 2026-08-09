/**
 * The derivation pass: a small config of seeds → the complete variable maps for
 * light and dark mode.
 *
 * Every variable in `.references/template.css` is accounted for here. `KNOB`
 * variables come straight from the config; `DERIVED` ones are computed from the
 * source their inline `NOTE:` names. Where the engine departs from the literal
 * value in `template.css` it is called out inline and in `README.md`, and
 * `derive.test.ts` pins the list down against the real file — 26 variables in
 * four groups, every one a consequence of a `NOTE:`, of HA's own documented
 * behaviour, or of a stale literal in the spec.
 *
 * Dark mode is derived in the same pass, never bolted on: each mode-dependent
 * variable is produced by one function that takes the mode.
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
import type {
  CssVarMap,
  DerivedTheme,
  FontOption,
  Hex,
  NeutralSlotId,
  PartialThemeConfig,
  Ramp,
  RampSlot,
  SurfaceChoice,
  ThemeConfig,
  ThemeMode,
} from "./types.ts";

/**
 * The default config: Home Assistant's current theme.
 *
 * One deliberate departure — `primaryBackground` is `neutral-95` (`#f3f3f3`)
 * where stock HA ships `#fafafa`. `#fafafa` is not on any neutral ramp, and the
 * knob's `NOTE:` restricts the control to "Neutral Ramp 80, 90, 95 + white", so
 * the nearest on-ramp value is used. Everything else matches HA exactly.
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
  cardBackground: "white",
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

// ---------------------------------------------------------------------------
// Neutral-slot plumbing
// ---------------------------------------------------------------------------

const WHITE: Hex = "#ffffff";

function slotOf(id: NeutralSlotId): RampSlot {
  return Number(id.slice("neutral-".length)) as RampSlot;
}

/**
 * The dark-mode counterpart of a neutral slot: `100 - slot`, so 05↔95, 10↔90,
 * 20↔80, 30↔70, 40↔60 and 50 maps to itself. This is the same inversion HA's
 * `darkSemanticColorStyles` performs on its surface and border tokens
 * (`ha_theme_analysis.md` §2.2), expressed as arithmetic instead of a table.
 */
function mirrorSlot(slot: RampSlot): RampSlot {
  return (100 - slot) as RampSlot;
}

const SLOT_ORDER: readonly RampSlot[] = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95];

/** Ramp lookup by position rather than slot number, clamped at both ends. */
function rampAt(ramp: Ramp, index: number): Hex {
  return ramp[SLOT_ORDER[Math.min(SLOT_ORDER.length - 1, Math.max(0, index))]];
}

/**
 * Where each background choice sits on the ramp, as a position. `white` is
 * treated as one rung above neutral-95 — it is not on the ramp, but it is one
 * step further from the ink, and that is what the elevation maths needs.
 */
const LIGHT_SURFACE_INDEX: Record<SurfaceChoice, number> = {
  white: 11,
  "neutral-95": 10,
  "neutral-90": 9,
  "neutral-80": 8,
};

/**
 * Where the *page* background lands in dark mode: further from the dark end for
 * softer (darker) light choices, which is the dark-mode reading of "less
 * contrast". `white` and `neutral-95` both mean "maximum contrast", so both
 * bottom out at the darkest rung — matching HA, whose dark page `#111111` is
 * the darkest surface in its theme.
 */
const DARK_PAGE_INDEX: Record<SurfaceChoice, number> = {
  white: 0,
  "neutral-95": 0,
  "neutral-90": 1,
  "neutral-80": 2,
};

interface Surfaces {
  card: Hex;
  page: Hex;
  secondary: Hex;
}

/**
 * Card, page and secondary backgrounds for one mode.
 *
 * The card and the page are derived **jointly**, not one at a time. Mapping
 * each choice through its own table looks fine until you pick, say, a
 * neutral-95 card on a neutral-90 page: two independent lookups can easily land
 * the dark card *below* the dark page and invert the elevation the user asked
 * for. So dark mode reproduces the *gap* between the two instead — the card
 * keeps however many ramp steps of elevation it had in light mode.
 *
 * With the defaults (white card, neutral-95 page, gap of one step) this lands
 * on `#202020` over `#141414`, which is as close to HA's own `#1c1c1c` over
 * `#111111` (§2.3) as the neutral ramp can express.
 *
 * `--secondary-background-color` is "5% darker than primary" per
 * `template.css`: one ramp step below the page in light mode — `#f3f3f3` →
 * `#e6e6e6` is a 4% drop in OKLCH lightness and lands one unit off HA's shipped
 * `#e5e5e5` — and two steps *above* it in dark mode. The asymmetry is HA's own:
 * its light pair differs by 0.06 in OKLCH lightness, its dark pair
 * (`#111111`/`#282828`) by 0.17, because near-black surfaces need a much larger
 * step to read as distinct. One dark step would be invisible and would collide
 * with the card.
 */
function surfaces(config: ThemeConfig, ramp: Ramp, mode: ThemeMode): Surfaces {
  const cardIndex = LIGHT_SURFACE_INDEX[config.cardBackground];
  const pageIndex = LIGHT_SURFACE_INDEX[config.primaryBackground];

  if (mode === "light") {
    const hex = (choice: SurfaceChoice) =>
      choice === "white" ? WHITE : ramp[slotOf(choice)];
    return {
      card: hex(config.cardBackground),
      page: hex(config.primaryBackground),
      // One step below the page, and never level with the card.
      secondary: rampAt(ramp, Math.min(pageIndex, cardIndex) - 1),
    };
  }

  const elevation = cardIndex - pageIndex;
  let darkPage = DARK_PAGE_INDEX[config.primaryBackground];
  // A card *below* its page (an odd but legal choice) needs headroom beneath
  // the page, or the clamp at the dark end would silently flatten the pair.
  if (darkPage + elevation < 0) darkPage = -elevation;
  const darkCard = darkPage + elevation;

  return {
    page: rampAt(ramp, darkPage),
    card: rampAt(ramp, darkCard),
    // Two steps above the page, and never level with the card — HA's own dark
    // ordering is page (#111111) < card (#1c1c1c) < secondary (#282828).
    secondary: rampAt(ramp, Math.max(darkPage + 2, darkCard + 1)),
  };
}

// ---------------------------------------------------------------------------
// Shadows and inputs — "derive using --ha-color-neutral-05 as base"
// ---------------------------------------------------------------------------

interface ShadowLayer {
  /** Offsets/blur/spread, verbatim from `template.css`. */
  geometry: string;
  /** Light-mode alpha as a 0..1 fraction. */
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
 * HA's dark-mode alpha for each shadow's *first* layer (`ha_theme_analysis.md`
 * §2.6). The second layer is scaled by the same factor, preserving the ratio
 * between the two layers that the light values establish.
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

/** Light-mode input alphas, verbatim from `template.css`. */
const INPUT_ALPHA = {
  "input-idle-line-color": "6b",
  "input-hover-line-color": "de",
  "input-disabled-line-color": "0f",
  "input-outlined-idle-border-color": "61",
  "input-outlined-hover-border-color": "de",
  "input-outlined-disabled-border-color": "0f",
  "input-ink-color": "de",
  "input-label-ink-color": "99", // template.css writes this as the shorthand #0009
  "input-disabled-ink-color": "5e",
  "input-dropdown-icon-color": "8a",
} as const;

// ---------------------------------------------------------------------------
// Text roles
// ---------------------------------------------------------------------------

/**
 * The neutral slots the three text roles occupy per mode.
 *
 * Light is `template.css` / HA's semantic layer (`--ha-color-text-primary` =
 * neutral-05, secondary = neutral-40, disabled = neutral-60).
 *
 * Dark uses HA's documented overrides where they exist: primary becomes pure
 * `white` and secondary neutral-80 (§2.2). Both of those sit *lighter* than a
 * plain slot mirror would put them (mirror(05) = 95, mirror(40) = 60), so
 * disabled follows the same direction — neutral-50 rather than mirror(60) =
 * neutral-40, which would drop it to a 2.1:1 ratio against a dark card where
 * light mode gives it 3.0:1.
 */
interface TextSlots {
  /** `null` means "pure white", which is what HA's dark override uses. */
  primary: RampSlot | null;
  secondary: RampSlot;
  disabled: RampSlot;
}

const TEXT_SLOTS: Record<ThemeMode, TextSlots> = {
  light: { primary: 5, secondary: 40, disabled: 60 },
  dark: { primary: null, secondary: 80, disabled: 50 },
};

// ---------------------------------------------------------------------------
// derive()
// ---------------------------------------------------------------------------

/**
 * Maps a knob config to the full set of Home Assistant theme variables.
 *
 * @throws {TypeError} on a malformed seed colour
 * @throws {RangeError} on an unknown font / ramp / palette id
 */
export function derive(input: PartialThemeConfig | ThemeConfig = {}): DerivedTheme {
  const config = resolveConfig(input as PartialThemeConfig);

  // --- ramps ------------------------------------------------------------
  const primary = generateRamp({
    seed: config.colors.primary,
    slot: KNOB_SLOT.primary,
    reference: REFERENCE_RAMPS.primary,
  });
  const red = generateRamp({
    seed: config.colors.error,
    slot: KNOB_SLOT.red,
    reference: REFERENCE_RAMPS.red,
  });
  const orange = generateRamp({
    seed: config.colors.warning,
    slot: KNOB_SLOT.orange,
    reference: REFERENCE_RAMPS.orange,
  });
  const green = generateRamp({
    seed: config.colors.success,
    slot: KNOB_SLOT.green,
    reference: REFERENCE_RAMPS.green,
  });
  const neutral = getNeutralRamp(config.neutralRamp).ramp;
  const palette = getExtendedPalette(config.palette).colors;

  const accent = normalizeHex(config.colors.accent);
  const info = normalizeHex(config.colors.info);

  const fonts = {
    body: getFont(config.fonts.body),
    heading: getFont(config.fonts.heading),
    longform: getFont(config.fonts.longform),
    code: getFont(config.fonts.code),
  };

  // --- mode-independent -------------------------------------------------
  const common: CssVarMap = {};

  // Typography
  common["ha-font-size-scale"] = "1";
  common["ha-font-family-body"] = fonts.body.stack;
  common["ha-font-family-code"] = fonts.code.stack;
  common["ha-font-family-longform"] = fonts.longform.stack;
  common["ha-font-family-heading"] = fonts.heading.stack;
  common["ha-font-weight-body"] = "400";
  common["ha-font-weight-heading"] = "700";
  common["ha-font-weight-action"] = "500";

  // Base colour ramps
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

  // Extended palette
  for (const name of PALETTE_COLOR_NAMES) {
    common[`${name}-color`] = palette[name];
  }

  // Grey simplified palette
  common["light-grey-color"] = neutral[70];
  common["grey-color"] = neutral[60];
  common["dark-grey-color"] = neutral[50];

  // Primary family. `template.css` binds these to ramp slots rather than to
  // HA's Lab brighten/darken (which only ever runs for the *built-in* theme,
  // never for a YAML theme — see README "Deviations").
  common["primary-color"] = primary[KNOB_SLOT.primary];
  common["dark-primary-color"] = primary[30];
  common["darker-primary-color"] = primary[20];
  common["light-primary-color"] = primary[50];

  // Text *on* the primary/accent colours: HA's own WCAG check, not the alias
  // `template.css` writes. See README "Deviations".
  common["text-primary-color"] = contrastingText(primary[KNOB_SLOT.primary]);
  common["text-light-primary-color"] = contrastingText(primary[50]);
  common["accent-color"] = accent;
  common["text-accent-color"] = contrastingText(accent);

  // Status
  common["error-color"] = red[KNOB_SLOT.red];
  common["warning-color"] = orange[KNOB_SLOT.orange];
  common["success-color"] = green[KNOB_SLOT.green];
  common["info-color"] = info;

  common["label-badge-grey"] = neutral[60];

  // Energy colours — "keep as is for the moment" (template.css).
  common["energy-grid-consumption-color"] = "#488fc2";
  common["energy-grid-return-color"] = "#8353d1";
  common["energy-solar-color"] = "#ff9800";
  common["energy-non-fossil-color"] = "#0f9d58";
  common["energy-battery-out-color"] = "#4db6ac";
  common["energy-battery-in-color"] = "#f06292";
  common["energy-gas-color"] = "#8e021b";
  common["energy-water-color"] = "#00bcd4";

  // rgb companions for mode-independent values
  common["rgb-primary-color"] = rgbTriplet(common["primary-color"]);
  common["rgb-accent-color"] = rgbTriplet(accent);
  common["rgb-text-primary-color"] = rgbTriplet(common["text-primary-color"]);
  common["rgb-warning-color"] = rgbTriplet(common["warning-color"]);
  common["rgb-error-color"] = rgbTriplet(common["error-color"]);
  common["rgb-success-color"] = rgbTriplet(common["success-color"]);
  common["rgb-info-color"] = rgbTriplet(info);

  // --- per-mode ---------------------------------------------------------
  const forMode = (mode: ThemeMode): CssVarMap => {
    const vars: CssVarMap = {};
    const dark = mode === "dark";

    // The base every "in place of 000000" derivation hangs off: the darkest
    // neutral in light mode, its mirror in dark mode.
    const inkBase = dark ? neutral[mirrorSlot(5)] : neutral[5];

    // Box shadows keep the *light* base in both modes — a shadow is an absence
    // of light, so it stays dark; only its opacity grows (§2.6).
    for (const size of ["s", "m", "l"] as const) {
      vars[`ha-box-shadow-${size}`] = shadow(size, neutral[5], mode);
    }

    // Inputs
    for (const [key, alpha] of Object.entries(INPUT_ALPHA)) {
      vars[key] = withAlpha(inkBase, alpha);
    }
    // Fill colours are solid surfaces, one and two steps from the card in the
    // direction of the foreground: recessed in light, raised in dark — which is
    // how HA renders them (dark inputs are a translucent *white* over the card).
    vars["input-fill-color"] = dark ? neutral[20] : neutral[95];
    vars["input-disabled-fill-color"] = dark ? neutral[30] : neutral[90];

    // Text
    const slots = TEXT_SLOTS[mode];
    vars["primary-text-color"] = slots.primary === null ? WHITE : neutral[slots.primary];
    vars["secondary-text-color"] = neutral[slots.secondary];
    vars["disabled-text-color"] = neutral[slots.disabled];
    vars["disabled-color"] = vars["disabled-text-color"];

    // Lines. The knob picks a neutral slot and the `1f` alpha is preserved;
    // outline-hover and shadow reuse that RGB at their own alphas.
    const lightBorderBase = neutral[slotOf(config.borderColor)];
    const borderBase = dark ? neutral[mirrorSlot(slotOf(config.borderColor))] : lightBorderBase;
    vars["divider-color"] = withAlpha(borderBase, "1f");
    vars["outline-color"] = vars["divider-color"];
    vars["outline-hover-color"] = withAlpha(borderBase, "3d");
    // `--shadow-color` keeps the *unmirrored* base: a shadow is an absence of
    // light in either mode, so it must not flip pale in dark mode the way the
    // divider does. Only the alpha grows — HA's own dark `--shadow-color` is
    // `rgba(0, 0, 0, 0.48)` = 0x7a against `rgba(0, 0, 0, 0.16)` in light (§6).
    vars["shadow-color"] = withAlpha(lightBorderBase, dark ? "7a" : "29");

    vars["scrollbar-thumb-color"] = neutral[dark ? mirrorSlot(70) : 70];

    // Backgrounds
    const surface = surfaces(config, neutral, mode);
    vars["card-background-color"] = surface.card;
    vars["primary-background-color"] = surface.page;
    vars["secondary-background-color"] = surface.secondary;
    vars["clear-background-color"] = surface.card;

    // Entity icons need to read against the surface, so this one slot flips.
    vars["state-icon-color"] = primary[dark ? mirrorSlot(30) : 30];

    // rgb companions for mode-dependent values
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

/** One fully-resolved variable map for a single mode. */
export function modeVars(theme: DerivedTheme, mode: ThemeMode): CssVarMap {
  return { ...theme.common, ...theme[mode] };
}

/**
 * The same map keyed by CSS custom-property name (`--primary-color`), ready for
 * `element.style.setProperty()` on a scoped preview container.
 */
export function toCssProperties(theme: DerivedTheme, mode: ThemeMode): CssVarMap {
  return Object.fromEntries(
    Object.entries(modeVars(theme, mode)).map(([k, v]) => [`--${k}`, v]),
  );
}
