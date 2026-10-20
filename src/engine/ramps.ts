import { hexToOklch, normalizeHex, oklchToHex, opaqueHex } from "./color.ts";
import { RAMP_SLOTS, type Hex, type Ramp, type RampSlot } from "./types.ts";

export interface GenerateRampOptions {
  /** The seed color. The output holds it unchanged at `slot`. */
  seed: string;
  /** Which slot the seed occupies. */
  slot: RampSlot;
  /** The ramp whose shape the output copies. */
  reference: Ramp;
}

const DARKEST: RampSlot = RAMP_SLOTS[0];
const LIGHTEST: RampSlot = RAMP_SLOTS[RAMP_SLOTS.length - 1];

/** Maps `v` linearly from `[a0,a1]` onto `[b0,b1]`. Returns `b0` when `a0 === a1`. */
function remap(v: number, a0: number, a1: number, b0: number, b1: number): number {
  if (a1 === a0) return b0;
  return b0 + ((v - a0) / (a1 - a0)) * (b1 - b0);
}

/**
 * Builds a full ramp (slots 05 to 95) from one seed color.
 *
 * The ramp copies the OKLCH shape of a reference ramp. Hue and chroma
 * match the seed at `slot`. Lightness maps piecewise around the seed.
 *
 * `result[slot]` equals `normalizeHex(seed)`. A seed equal to the reference
 * at `slot` returns the reference ramp. Lightness is monotonic.
 *
 * @example
 * generateRamp({ seed: "#009ac7", slot: 40, reference: HA_PRIMARY_RAMP });
 */
export function generateRamp({ seed, slot, reference }: GenerateRampOptions): Ramp {
  const seedHex = opaqueHex(seed);
  const anchorHex = normalizeHex(reference[slot]);

  // Return the reference unchanged. A round trip through OKLCH can drift.
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
  // A near-gray anchor gives an unstable chroma ratio. Use an offset.
  const chromaScale = anchor.c > 1e-4 ? seedLch.c / anchor.c : 0;
  const chromaOffset = anchor.c > 1e-4 ? 0 : seedLch.c - anchor.c;

  // A seed outside the reference lightness range would fold the ramp. Widen the range.
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

/** Returns the ramp as `[slot, hex]` pairs, darkest first. */
export function rampEntries(ramp: Ramp): readonly (readonly [RampSlot, Hex])[] {
  return RAMP_SLOTS.map((s) => [s, ramp[s]] as const);
}
