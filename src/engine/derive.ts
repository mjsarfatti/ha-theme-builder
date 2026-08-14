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
 * The default config — **Home Assistant Refined**, which is `template.css`.
 *
 * Not the theme HA ships today: `template.css` is a redesign that moves stock's
 * off-ramp values onto the ramps, so `--primary-background-color` is `neutral-95`
 * rather than `#fafafa`. Around 40 variables per mode differ, all of them small.
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
  cardBackground: "neutral-100", // formerly "white" — see NeutralRampSlot
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

function slotOf(id: NeutralSlotId): NeutralRampSlot {
  return Number(id.slice("neutral-".length)) as NeutralRampSlot;
}

/**
 * The dark-mode counterpart of a slot: `100 - slot`, so 05↔95, 10↔90, 20↔80,
 * 30↔70, 40↔60 and 50 maps to itself. Generic over {@link RampSlot} and
 * {@link NeutralRampSlot} — both domains are symmetric about 50, the neutral
 * one now including 00↔100 — so one function serves the text/border/scrollbar
 * uses (which stay on the 11-slot domain) and the neutral-only lookups alike.
 * This is the same inversion HA's `darkSemanticColorStyles` performs on its
 * surface and border tokens (`ha_theme_analysis.md` §2.2), expressed as
 * arithmetic instead of a table.
 */
function mirrorSlot<S extends RampSlot | NeutralRampSlot>(slot: S): S {
  return (100 - slot) as S;
}

const SLOT_ORDER: readonly RampSlot[] = RAMP_SLOTS;

/** Neutral-ramp lookup by position along the full 00..100 slot order, clamped at both ends. */
function neutralRampAt(ramp: NeutralRamp, index: number): Hex {
  const i = Math.min(NEUTRAL_RAMP_SLOTS.length - 1, Math.max(0, index));
  return ramp[NEUTRAL_RAMP_SLOTS[i]];
}

/** The last valid index into {@link NEUTRAL_RAMP_SLOTS}. */
const LAST_NEUTRAL_INDEX = NEUTRAL_RAMP_SLOTS.length - 1;

/** An index's mirror in {@link NEUTRAL_RAMP_SLOTS}, unclamped (callers read through {@link neutralRampAt}, which clamps). */
function mirrorNeutralIndex(index: number): number {
  return LAST_NEUTRAL_INDEX - index;
}

/**
 * Where each background choice sits in the neutral ramp's own 13-position
 * index space ({@link NEUTRAL_RAMP_SLOTS}). Every `SurfaceChoice` is now a
 * real ramp slot — `neutral-100` is what used to be the special-cased
 * "white" — so this is a plain lookup, not a table with an off-ramp entry
 * tacked on the end.
 */
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
 * Card, page and secondary backgrounds for one mode.
 *
 * **Dark mode keeps the light/dark relationship the user chose, not the raw
 * distance.** Home Assistant's own theme keeps the card *lighter* than the
 * page in both modes: light `#fafafa` page / `#ffffff` card, dark `#111111`
 * page / `#1c1c1c` card (`color.globals.ts:46-47`, `:342-343`). Mirroring
 * both surfaces independently preserves the gap between them but reverses
 * which one is on top, sinking the dark card below the dark page for every
 * ordinary configuration.
 *
 * So instead: identify whichever of the two is DARKER in light mode, mirror
 * *that one's own index* to get its dark-mode position, then place the other
 * surface the same number of index-steps away from that anchor, moving
 * toward the lighter end. The gap the user chose survives; which surface is
 * on top does too. If the two choices are equal, both mirror to the same
 * anchor and the gap is zero.
 *
 * This is also the clamp-safe direction: the anchor only ever gains index
 * steps to place the other surface, so the result can't fall below the ramp
 * floor the way mirroring the *lighter* surface first can (a `neutral-95`
 * page under a `neutral-100` card would mirror the card to index 0, then
 * need to derive the page at index −1).
 *
 * All arithmetic happens in **index space** along {@link NEUTRAL_RAMP_SLOTS},
 * not in slot numbers — the slots are unevenly spaced (`[0, 5, 10, 20, … 90,
 * 95, 100]`), so subtracting slot numbers would land on non-existent slots
 * like `neutral-15`. `neutralRampAt` clamps defensively at both ends, same as
 * `rampAt` always has; with today's four `SurfaceChoice` values the clamp
 * never actually fires (verified: across all sixteen combinations the
 * furthest an index travels is 6, comfortably inside the valid `0..12`
 * range), but a future, wider `SurfaceChoice` could reach it. At that
 * boundary the two surfaces are allowed to collapse onto the same slot —
 * the same thing already happens deliberately when the two choices are
 * equal — rather than the engine throwing or silently escaping the ramp.
 *
 * `--secondary-background-color` is "5% darker than primary" per
 * `template.css`: one ramp step below the darker of the two in light mode —
 * `#f3f3f3` → `#e6e6e6` is a 4% drop in OKLCH lightness and lands one unit
 * off HA's shipped `#e5e5e5` — and two steps *above* it in dark mode. The
 * asymmetry is HA's own: its light pair differs by 0.06 in OKLCH lightness,
 * its dark pair (`#111111`/`#282828`) by 0.17, because near-black surfaces
 * need a much larger step to read as distinct. One dark step would be
 * invisible and would collide with the card.
 */
function surfaces(config: ThemeConfig, neutral: NeutralRamp, mode: ThemeMode): Surfaces {
  const cardIndex = SURFACE_INDEX[config.cardBackground];
  const pageIndex = SURFACE_INDEX[config.primaryBackground];

  if (mode === "light") {
    return {
      card: neutralRampAt(neutral, cardIndex),
      page: neutralRampAt(neutral, pageIndex),
      // One step below the darker of the two, and never level with either.
      secondary: neutralRampAt(neutral, Math.min(cardIndex, pageIndex) - 1),
    };
  }

  const darkerIndex = Math.min(cardIndex, pageIndex);
  const lighterIndex = Math.max(cardIndex, pageIndex);
  const gap = lighterIndex - darkerIndex;
  const anchor = mirrorNeutralIndex(darkerIndex);
  const other = anchor + gap;

  // Whichever surface was darker in light mode keeps the anchor; the other
  // is placed `gap` steps toward the lighter end from it. When the two
  // choices are equal both comparisons pick `anchor`, so they mirror to the
  // same slot together, per the doc comment above.
  const darkCardIndex = cardIndex <= pageIndex ? anchor : other;
  const darkPageIndex = pageIndex <= cardIndex ? anchor : other;

  return {
    card: neutralRampAt(neutral, darkCardIndex),
    page: neutralRampAt(neutral, darkPageIndex),
    // Two steps above the page, and never level with the card — HA's own dark
    // ordering is page (#111111) < card (#1c1c1c) < secondary (#282828).
    secondary: neutralRampAt(neutral, Math.max(darkPageIndex + 2, darkCardIndex + 1)),
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
// Seed colour resolution — SeedColor -> Hex
// ---------------------------------------------------------------------------

const PALETTE_REF_PREFIX = "palette:";

/** `true` for a `palette:${PaletteColorName}` reference, `false` for a literal hex. */
function isPaletteRef(seed: SeedColor): seed is `palette:${PaletteColorName}` {
  return seed.startsWith(PALETTE_REF_PREFIX);
}

/**
 * Resolves a `colors.*` seed to a literal hex. A `palette:${name}` reference
 * reads the *current* `palette` preset's own colour for that name, so the
 * knob's colour follows the preset when the user later changes it — the
 * literal hex it read is not cached anywhere.
 *
 * A reference can only ever name one of the 18 static entity-palette colours
 * (`PaletteColorName`), never one of the four *generated* ramps (primary,
 * red, orange, green): those ramps are generated *from* these same seed
 * fields below, so a reference into one of them would have no fixed point to
 * resolve to before the ramp exists. `SeedColor`'s own type makes that
 * reference impossible to construct in the first place — this function only
 * guards against a malformed string reaching it past a type assertion, the
 * same posture `getFont` / `getNeutralRamp` / `getExtendedPalette` take.
 *
 * @throws {RangeError} when a reference names a colour the palette does not have.
 */
function resolveSeed(seed: SeedColor, palette: Record<PaletteColorName, Hex>): Hex {
  if (!isPaletteRef(seed)) return seed;
  const name = seed.slice(PALETTE_REF_PREFIX.length) as PaletteColorName;
  const hex = palette[name];
  if (!hex) throw new RangeError(`Unknown palette colour reference: ${JSON.stringify(seed)}`);
  return hex;
}

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

  // --- presets, ahead of any ramp math: a palette reference below needs the
  // resolved palette, and the neutral ramp's surface/border maths needs the
  // full 00..100 ramp `getNeutralRamp` now ships -------------------------
  const neutralExtended = getNeutralRamp(config.neutralRamp).ramp;
  const neutral: Ramp = Object.fromEntries(
    RAMP_SLOTS.map((s) => [s, neutralExtended[s]]),
  ) as Ramp;
  const palette = getExtendedPalette(config.palette).colors;

  // --- seed resolution ----------------------------------------------------
  // Resolved here, once, before any ramp math runs — see `resolveSeed`.
  const seed = {
    primary: resolveSeed(config.colors.primary, palette),
    error: resolveSeed(config.colors.error, palette),
    warning: resolveSeed(config.colors.warning, palette),
    success: resolveSeed(config.colors.success, palette),
    accent: resolveSeed(config.colors.accent, palette),
    info: resolveSeed(config.colors.info, palette),
  };

  // --- ramps ------------------------------------------------------------
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
  // `template.css` writes. HA's source settles it — `color.globals.ts:10-11`
  // ships `#ffffff` / `#212121`, and `apply_themes_on_element.ts:91` is the
  // contrast rule that produces them. See README "Deviations".
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

    // Backgrounds. Computed ahead of the border knob below, because a
    // `"match-card"` border reads this mode's own card colour directly.
    const surface = surfaces(config, neutralExtended, mode);
    vars["card-background-color"] = surface.card;
    vars["primary-background-color"] = surface.page;
    vars["secondary-background-color"] = surface.secondary;
    vars["clear-background-color"] = surface.card;

    // Lines. `"match-card"` resolves to this mode's own, already-computed
    // card colour — not a ramp lookup, and not `mirrorSlot()`. `surfaces()`
    // derives the dark card jointly from *both* surface knobs, so it is not
    // the mirror of the light card's slot, and a per-slot mirror would give a
    // different, wrong hex here. Otherwise the knob picks a neutral slot and
    // the `1f` alpha is preserved; outline-hover reuses that RGB at its own
    // alpha.
    const borderBase: Hex =
      config.borderColor === "match-card"
        ? surface.card
        : neutralExtended[
            dark ? mirrorSlot(slotOf(config.borderColor)) : slotOf(config.borderColor)
          ];
    vars["divider-color"] = withAlpha(borderBase, "1f");
    vars["outline-color"] = vars["divider-color"];
    vars["outline-hover-color"] = withAlpha(borderBase, "3d");
    // `--shadow-color` is decoupled from the border knob entirely — a shadow
    // is an absence of light below a card, not a tint of the border, and once
    // the border can resolve to the card colour the old coupling would turn a
    // "match-card" shadow into card-on-card and make it vanish, alpha or no
    // alpha. `template.css:144`'s block NOTE puts the whole Lines block —
    // divider, outline, outline-hover *and* shadow — on
    // `--ha-color-neutral-05`; only line 148's own per-line comment says the
    // shadow derives from `--divider-color` instead. The owner decided in
    // favour of the block NOTE. Fixed base, independent of the border knob
    // and of mode; only the alpha grows — HA's own dark `--shadow-color` is
    // `rgba(0, 0, 0, 0.48)` = 0x7a against `rgba(0, 0, 0, 0.16)` in light (§6).
    vars["shadow-color"] = withAlpha(neutral[5], dark ? "7a" : "29");

    vars["scrollbar-thumb-color"] = neutral[dark ? mirrorSlot(70) : 70];

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
