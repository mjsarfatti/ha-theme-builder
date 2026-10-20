/**
 * Hex, RGB and OKLCH color helpers.
 *
 * Ramp generation uses OKLCH through `culori`. `ha-math.ts` holds the
 * HA-parity math with its own constants.
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
 * Converts a hex string to lowercase `#rrggbb`, or `#rrggbbaa` with alpha.
 *
 * Accepts 3, 4, 6 and 8 digits and an optional `#`. Throws a `TypeError`
 * for any other input.
 *
 * @example
 * normalizeHex("ABC"); // "#aabbcc"
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

/** Returns `true` when the string is a hex color. */
export function isHex(input: string): boolean {
  return HEX_RE.test(input.trim());
}

/** Removes the alpha channel and returns `#rrggbb`. */
export function opaqueHex(input: string): Hex {
  return normalizeHex(input).slice(0, 7);
}

/** Converts a hex color to 0..255 RGB channels. */
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

/** Converts 0..255 RGB channels to `#rrggbb`. Rounds and clamps each channel. */
export function rgbToHex({ r, g, b }: Rgb255): Hex {
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Formats a color as `"0, 154, 199"`, the value form of HA `--rgb-*` variables. */
export function rgbTriplet(input: string): string {
  const { r, g, b } = hexToRgb(input);
  return `${r}, ${g}, ${b}`;
}

/**
 * Appends a two-digit hex alpha to an opaque color.
 *
 * `alpha` is a hex string or a number from 0 to 1. `template.css` writes
 * translucent values as 8-digit hex.
 *
 * @example
 * withAlpha("#141414", "1f"); // "#1414141f"
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

/** Returns the alpha of a hex color as 0..1. Returns 1 for an opaque color. */
export function alphaOf(input: string): number {
  const hex = normalizeHex(input);
  return hex.length === 9 ? Number.parseInt(hex.slice(7, 9), 16) / 255 : 1;
}

export interface OklchColor {
  /** Perceptual lightness, 0..1. */
  l: number;
  /** Chroma, 0..~0.4 for sRGB. */
  c: number;
  /** Hue in degrees, 0..360. */
  h: number;
}

/** Converts a hex color to OKLCH. Achromatic colors get hue 0. */
export function hexToOklch(input: string): OklchColor {
  const parsed = toOklch(opaqueHex(input));
  if (!parsed) throw new TypeError(`Not a colour: ${JSON.stringify(input)}`);
  return { l: parsed.l, c: parsed.c, h: parsed.h ?? 0 };
}

/** Half of one 8-bit step. A channel this close to the range rounds to a valid value. */
const CHANNEL_EPSILON = 0.5 / 255;

/**
 * Converts OKLCH to hex and maps the color into the sRGB gamut.
 *
 * Gamut mapping reduces chroma and keeps lightness and hue (CSS Color 4).
 * Skip `clampChroma` for in-gamut colors: it shifts edge colors
 * (`#0000ff` becomes `#0031e5`).
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
