/**
 * Home Assistant's color math, ported by hand.
 *
 * HA `src/common/color/lab.ts` uses the chroma.js D65 white point (Xn 0.95047,
 * Zn 1.08883). `culori` uses a white point that differs in the fourth
 * decimal, so this module owns its conversions.
 */
import { hexToRgb, rgbToHex } from "./color.ts";
import type { Hex } from "./types.ts";

/** chroma.js and HA Lab constants. `Kn` is one brighten step in L* units. */
const LAB = {
  Kn: 18,
  Xn: 0.95047,
  Yn: 1,
  Zn: 1.08883,
  t0: 4 / 29,
  t1: 6 / 29,
  t2: 3 * (6 / 29) * (6 / 29),
  t3: (6 / 29) ** 3,
} as const;

export type Lab = [l: number, a: number, b: number];

const rgbToXyzChannel = (v: number): number => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const xyzToLabChannel = (t: number): number =>
  t > LAB.t3 ? Math.cbrt(t) : t / LAB.t2 + LAB.t0;

const labToXyzChannel = (t: number): number =>
  t > LAB.t1 ? t * t * t : LAB.t2 * (t - LAB.t0);

const xyzToRgbChannel = (v: number): number =>
  255 * (v <= 0.00304 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** sRGB (0..255 per channel) → CIE L*a*b*, HA's variant. */
export function rgb2lab(rgb: readonly [number, number, number]): Lab {
  const r = rgbToXyzChannel(rgb[0]);
  const g = rgbToXyzChannel(rgb[1]);
  const b = rgbToXyzChannel(rgb[2]);
  const x = xyzToLabChannel((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB.Xn);
  const y = xyzToLabChannel((0.2126729 * r + 0.7151522 * g + 0.072175 * b) / LAB.Yn);
  const z = xyzToLabChannel((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / LAB.Zn);
  const l = 116 * y - 16;
  return [l < 0 ? 0 : l, 500 * (x - y), 200 * (y - z)];
}

/** CIE L*a*b* → sRGB (0..255 per channel, clamped). */
export function lab2rgb([l, a, bb]: Lab): [number, number, number] {
  let y = (l + 16) / 116;
  let x = Number.isNaN(a) ? y : y + a / 500;
  let z = Number.isNaN(bb) ? y : y - bb / 200;

  y = LAB.Yn * labToXyzChannel(y);
  x = LAB.Xn * labToXyzChannel(x);
  z = LAB.Zn * labToXyzChannel(z);

  const clamp = (v: number): number => Math.min(255, Math.max(0, v));
  return [
    clamp(xyzToRgbChannel(3.2404542 * x - 1.5371385 * y - 0.4985314 * z)),
    clamp(xyzToRgbChannel(-0.969266 * x + 1.8760108 * y + 0.041556 * z)),
    clamp(xyzToRgbChannel(0.0556434 * x - 0.2040259 * y + 1.0572252 * z)),
  ];
}

/** Shifts L* by `Kn * amount`. HA's `labBrighten`. */
export function labBrighten(lab: Lab, amount = 1): Lab {
  return [lab[0] + LAB.Kn * amount, lab[1], lab[2]];
}

/** Shifts L* by `-Kn * amount`. HA's `labDarken`. */
export function labDarken(lab: Lab, amount = 1): Lab {
  return labBrighten(lab, -amount);
}

/** Hex convenience wrapper around {@link labBrighten}. */
export function brighten(hex: string, amount = 1): Hex {
  const { r, g, b } = hexToRgb(hex);
  const [nr, ng, nb] = lab2rgb(labBrighten(rgb2lab([r, g, b]), amount));
  return rgbToHex({ r: nr, g: ng, b: nb });
}

/** Hex convenience wrapper around {@link labDarken}. */
export function darken(hex: string, amount = 1): Hex {
  return brighten(hex, -amount);
}

/** WCAG relative luminance of an sRGB triplet. HA's `luminosity`. */
export function luminosity(rgb: readonly [number, number, number]): number {
  const lum = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
}

/** WCAG contrast ratio between two sRGB triplets, 1..21. HA's `rgbContrast`. */
export function rgbContrast(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  const la = luminosity(a);
  const lb = luminosity(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Contrast ratio between two hex colors. */
export function contrastRatio(a: string, b: string): number {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbContrast([ca.r, ca.g, ca.b], [cb.r, cb.g, cb.b]);
}

/** Dark text color HA puts on light surfaces. */
export const HA_DARK_INK = "#212121";
/** Light text color HA puts on dark surfaces. */
export const HA_LIGHT_INK = "#ffffff";

/**
 * Contrast threshold HA uses for `text-primary-color` and `text-accent-color`.
 *
 * `apply_themes_on_element.ts:91` tests `rgbContrast(color, [33,33,33]) < 6`.
 * HA's default primary `#009ac7` scores 4.95 against `#212121`, so it gets
 * white text.
 */
export const HA_CONTRAST_THRESHOLD = 6;

/**
 * Picks the text color for a surface, as HA does.
 *
 * Returns white when the contrast against `#212121` is below
 * {@link HA_CONTRAST_THRESHOLD}. Returns `#212121` otherwise.
 */
export function contrastingText(surface: string): Hex {
  return contrastRatio(surface, HA_DARK_INK) < HA_CONTRAST_THRESHOLD
    ? HA_LIGHT_INK
    : HA_DARK_INK;
}
