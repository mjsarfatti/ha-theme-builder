/**
 * Ramp generation: one seed colour at one slot → a full 05..95 ramp.
 *
 * `template.css` says: *"Generate ramps from the [KNOB] shade, show only the
 * [KNOB] shade to the user"*. So the user hands us, say, `#009ac7` for
 * `--ha-color-primary-40`, and we have to invent the other ten shades.
 *
 * The approach is **shape transfer in OKLCH**: every hue family ships a
 * reference ramp (Home Assistant's own), which encodes how that family's
 * lightness and chroma move across the scale. A generated ramp reuses that
 * shape, re-anchored on the seed:
 *
 * - **Hue** is rotated by the seed's offset from the reference at that slot.
 * - **Chroma** is scaled by the seed's ratio to the reference at that slot, so
 *   a muted seed produces a muted ramp and a vivid seed a vivid one.
 * - **Lightness** is re-anchored piecewise: the slots below the seed are
 *   remapped onto `[darkest, seedL]` and the slots above onto `[seedL,
 *   lightest]`, preserving the reference's spacing within each half. This keeps
 *   the ramp monotonic and keeps the endpoints near the reference extremes,
 *   which is what makes shade 05 usable as "ink" and 95 as "wash".
 *
 * Out-of-gamut results are mapped back into sRGB by reducing chroma at constant
 * lightness and hue (see `oklchToHex`).
 */
import { hexToOklch, normalizeHex, oklchToHex, opaqueHex } from "./color.ts";
import { RAMP_SLOTS, type Hex, type Ramp, type RampSlot } from "./types.ts";

export interface GenerateRampOptions {
  /** The user's colour. Survives verbatim at `slot` in the output. */
  seed: string;
  /** Which slot the seed occupies. */
  slot: RampSlot;
  /** The ramp whose shape is transferred (Home Assistant's, by default). */
  reference: Ramp;
}

const DARKEST: RampSlot = RAMP_SLOTS[0];
const LIGHTEST: RampSlot = RAMP_SLOTS[RAMP_SLOTS.length - 1];

/** Linear remap of `v` from `[a0,a1]` onto `[b0,b1]`; identity if `a0 === a1`. */
function remap(v: number, a0: number, a1: number, b0: number, b1: number): number {
  if (a1 === a0) return b0;
  return b0 + ((v - a0) / (a1 - a0)) * (b1 - b0);
}

/**
 * Builds a full ramp around `seed`.
 *
 * Guarantees:
 * - `result[slot] === normalizeHex(seed)` — always, byte for byte.
 * - When the seed already equals the reference at that slot, the reference ramp
 *   is returned unchanged, so the default config reproduces HA's shipped ramps
 *   exactly rather than a re-quantised approximation of them.
 * - Lightness is non-decreasing from slot 05 to slot 95.
 */
export function generateRamp({ seed, slot, reference }: GenerateRampOptions): Ramp {
  const seedHex = opaqueHex(seed);
  const anchorHex = normalizeHex(reference[slot]);

  // Identity: nothing to transfer, and round-tripping would only risk drift.
  if (seedHex === anchorHex) {
    return Object.fromEntries(
      RAMP_SLOTS.map((s) => [s, normalizeHex(reference[s])]),
    ) as Ramp;
  }

  const ref = Object.fromEntries(
    RAMP_SLOTS.map((s) => [s, hexToOklch(reference[s])]),
  ) as Record<RampSlot, ReturnType<typeof hexToOklch>>;

  const seedLch = hexToOklch(seedHex);
  const anchor = ref[slot];

  const hueShift = seedLch.h - anchor.h;
  // A near-grey anchor gives no meaningful ratio; fall back to an additive
  // offset so a chromatic seed on a grey reference still produces colour.
  const chromaScale = anchor.c > 1e-4 ? seedLch.c / anchor.c : 0;
  const chromaOffset = anchor.c > 1e-4 ? 0 : seedLch.c - anchor.c;

  // Widen the anchors if the seed sits outside the reference's own range, so
  // the remap can never fold the ramp back on itself.
  const darkL = Math.min(ref[DARKEST].l, seedLch.l);
  const lightL = Math.max(ref[LIGHTEST].l, seedLch.l);

  const out = {} as Ramp;
  for (const s of RAMP_SLOTS) {
    if (s === slot) {
      out[s] = seedHex;
      continue;
    }
    const r = ref[s];
    const l =
      s < slot
        ? remap(r.l, ref[DARKEST].l, anchor.l, darkL, seedLch.l)
        : remap(r.l, anchor.l, ref[LIGHTEST].l, seedLch.l, lightL);

    out[s] = oklchToHex({
      l,
      c: Math.max(0, r.c * chromaScale + chromaOffset),
      h: r.h + hueShift,
    });
  }
  return out;
}

/** Reads a ramp back out as an ordered `[slot, hex]` list, darkest first. */
export function rampEntries(ramp: Ramp): readonly (readonly [RampSlot, Hex])[] {
  return RAMP_SLOTS.map((s) => [s, ramp[s]] as const);
}
