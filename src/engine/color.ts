/**
 * Low-level colour helpers.
 *
 * Perceptual work (ramp generation) happens in OKLCH via `culori`; the
 * HA-parity derivations live in `ha-math.ts` and deliberately do *not* use
 * culori, so they can mirror Home Assistant's own constants exactly.
 */
import { clampChroma, converter, formatHex, type Oklch } from "culori";

import type { Hex } from "./types.ts";

const toOklch = converter("oklch");
const toRgb = converter("rgb");

export interface Rgb255 {
  r: number;
  g: number;
  b: number;
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * Normalises any accepted hex spelling to lowercase `#rrggbb` (or `#rrggbbaa`
 * when the input carried alpha). Throws on anything else — the engine never
 * silently swallows a bad seed colour.
 */
export function normalizeHex(input: string): Hex {
  const match = HEX_RE.exec(input.trim());
  if (!match) throw new TypeError(`Not a hex colour: ${JSON.stringify(input)}`);
  const digits = match[1].toLowerCase();
  if (digits.length === 3 || digits.length === 4) {
    return `#${[...digits].map((d) => d + d).join("")}`;
  }
  return `#${digits}`;
}

/** `true` when the string parses as a hex colour. */
export function isHex(input: string): boolean {
  return HEX_RE.test(input.trim());
}

/** Strips any alpha channel, returning `#rrggbb`. */
export function opaqueHex(input: string): Hex {
  return normalizeHex(input).slice(0, 7);
}

export function hexToRgb(input: string): Rgb255 {
  const hex = normalizeHex(input);
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

const channel = (value: number): string =>
  Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0");

export function rgbToHex({ r, g, b }: Rgb255): Hex {
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** `"0, 154, 199"` — the spelling HA uses for its `--rgb-*` companions. */
export function rgbTriplet(input: string): string {
  const { r, g, b } = hexToRgb(input);
  return `${r}, ${g}, ${b}`;
}

/**
 * Appends a two-digit hex alpha to an opaque colour, e.g. `("#141414", "1f")`
 * → `"#1414141f"`. `template.css` expresses every translucent value this way,
 * and 8-digit hex is what we emit so the result stays greppable against it.
 */
export function withAlpha(input: string, alpha: number | string): Hex {
  const base = opaqueHex(input);
  const hex =
    typeof alpha === "string"
      ? alpha.toLowerCase().padStart(2, "0")
      : channel(Math.round(alpha * 255));
  if (!/^[0-9a-f]{2}$/.test(hex)) {
    throw new TypeError(`Not a hex alpha: ${JSON.stringify(alpha)}`);
  }
  return `${base}${hex}`;
}

/** Reads the alpha of an 8-digit hex as a 0..1 number (1 when absent). */
export function alphaOf(input: string): number {
  const hex = normalizeHex(input);
  return hex.length === 9 ? Number.parseInt(hex.slice(7, 9), 16) / 255 : 1;
}

// ---------------------------------------------------------------------------
// OKLCH
// ---------------------------------------------------------------------------

export interface OklchColor {
  /** Perceptual lightness, 0..1. */
  l: number;
  /** Chroma, 0..~0.4 for sRGB. */
  c: number;
  /** Hue in degrees, 0..360. `NaN` for achromatic colours in culori. */
  h: number;
}

export function hexToOklch(input: string): OklchColor {
  const parsed = toOklch(opaqueHex(input));
  if (!parsed) throw new TypeError(`Not a colour: ${JSON.stringify(input)}`);
  return { l: parsed.l, c: parsed.c, h: parsed.h ?? 0 };
}

/** Half an 8-bit step: anything inside this rounds to a valid channel. */
const CHANNEL_EPSILON = 0.5 / 255;

/**
 * Converts back to hex, gamut-mapping into sRGB by reducing chroma while
 * holding lightness and hue — the standard CSS Color 4 approach, and the one
 * that keeps a generated ramp monotonic in lightness.
 *
 * The in-gamut fast path is not an optimisation, it is a correctness fix:
 * `clampChroma` decides membership with a JND-based binary search, so colours
 * sitting *on* the sRGB boundary (pure blue is the classic one) get their
 * chroma shaved even though they are perfectly representable — `#0000ff` comes
 * back as `#0031e5`. We therefore only hand a colour to the chroma reduction
 * when it is out of gamut by more than a rounding error.
 */
export function oklchToHex({ l, c, h }: OklchColor): Hex {
  const color: Oklch = {
    mode: "oklch",
    l: Math.min(1, Math.max(0, l)),
    c: Math.max(0, c),
    h: ((h % 360) + 360) % 360,
  };
  const rgb = toRgb(color);
  const inGamut = ([rgb.r, rgb.g, rgb.b] as const).every(
    (v) => v >= -CHANNEL_EPSILON && v <= 1 + CHANNEL_EPSILON,
  );
  if (inGamut) {
    return rgbToHex({ r: rgb.r * 255, g: rgb.g * 255, b: rgb.b * 255 });
  }
  return formatHex(clampChroma(color, "oklch", "rgb")) as Hex;
}
