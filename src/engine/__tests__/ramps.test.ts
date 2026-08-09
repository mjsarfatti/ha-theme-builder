import { describe, expect, it } from "vitest";

import { hexToOklch, normalizeHex } from "../color.ts";
import { KNOB_SLOT, REFERENCE_RAMPS } from "../presets/index.ts";
import { generateRamp, rampEntries } from "../ramps.ts";
import { RAMP_SLOTS, type Hex, type Ramp, type RampSlot } from "../types.ts";

const FAMILIES = [
  ["primary", REFERENCE_RAMPS.primary, KNOB_SLOT.primary],
  ["red", REFERENCE_RAMPS.red, KNOB_SLOT.red],
  ["orange", REFERENCE_RAMPS.orange, KNOB_SLOT.orange],
  ["green", REFERENCE_RAMPS.green, KNOB_SLOT.green],
] as const;

/** A spread of awkward seeds every family gets exercised with. */
const SEEDS: readonly string[] = [
  "#000000", // pure black
  "#ffffff", // pure white
  "#ff0000", // fully saturated primary
  "#00ff00",
  "#0000ff",
  "#7a7a7a", // achromatic mid grey
  "#7c5cff", // an ordinary brand purple
  "#123456",
  "#fefefe", // barely off white
  "#010101", // barely off black
];

function lightnesses(ramp: Ramp): number[] {
  return RAMP_SLOTS.map((s) => hexToOklch(ramp[s]).l);
}

describe("generateRamp — the seed survives", () => {
  it.each(FAMILIES)("%s: returns the seed verbatim at its own slot", (_name, reference, slot) => {
    for (const seed of SEEDS) {
      const ramp = generateRamp({ seed, slot, reference });
      expect(ramp[slot], `${seed} @ ${slot}`).toBe(seed);
    }
  });

  it("round-trips a seed through the generator unchanged, at every slot", () => {
    // The property that matters most: whatever the user typed comes back out,
    // not a re-quantised approximation of it.
    for (const slot of RAMP_SLOTS) {
      for (const seed of SEEDS) {
        const ramp = generateRamp({ seed, slot, reference: REFERENCE_RAMPS.primary });
        expect(ramp[slot], `${seed} @ ${slot}`).toBe(normalizeHex(seed));
      }
    }
  });

  it("normalises shorthand and uppercase seeds without changing the colour", () => {
    const ramp = generateRamp({
      seed: "#ABC",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    expect(ramp[40]).toBe("#aabbcc");
  });

  it("ignores an alpha channel on the seed", () => {
    const ramp = generateRamp({
      seed: "#7c5cff80",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    expect(ramp[40]).toBe("#7c5cff");
  });
});

describe("generateRamp — identity", () => {
  it.each(FAMILIES)(
    "%s: a seed already at its reference value returns the reference ramp untouched",
    (_name, reference, slot) => {
      const ramp = generateRamp({ seed: reference[slot], slot, reference });
      expect(ramp).toEqual(reference);
    },
  );

  it("holds for a seed already at a ramp endpoint", () => {
    for (const slot of [5, 95] as const) {
      const ramp = generateRamp({
        seed: REFERENCE_RAMPS.primary[slot],
        slot,
        reference: REFERENCE_RAMPS.primary,
      });
      expect(ramp).toEqual(REFERENCE_RAMPS.primary);
    }
  });

  it("is insensitive to how the identical seed is spelled", () => {
    expect(
      generateRamp({ seed: "#009AC7", slot: 40, reference: REFERENCE_RAMPS.primary }),
    ).toEqual(REFERENCE_RAMPS.primary);
  });
});

describe("generateRamp — shape", () => {
  it.each(FAMILIES)("%s: lightness never decreases from 05 to 95", (_name, reference, slot) => {
    for (const seed of SEEDS) {
      const ls = lightnesses(generateRamp({ seed, slot, reference }));
      for (let i = 1; i < ls.length; i++) {
        expect(ls[i], `${seed}: slot ${RAMP_SLOTS[i]} vs ${RAMP_SLOTS[i - 1]}`).toBeGreaterThanOrEqual(
          ls[i - 1] - 1e-9,
        );
      }
    }
  });

  it("holds monotonicity when the seed is placed at every slot", () => {
    for (const slot of RAMP_SLOTS) {
      for (const seed of SEEDS) {
        const ls = lightnesses(
          generateRamp({ seed, slot, reference: REFERENCE_RAMPS.green }),
        );
        for (let i = 1; i < ls.length; i++) {
          expect(ls[i], `${seed} @ ${slot}`).toBeGreaterThanOrEqual(ls[i - 1] - 1e-9);
        }
      }
    }
  });

  it("emits a valid opaque hex for every slot", () => {
    for (const slot of RAMP_SLOTS) {
      for (const seed of SEEDS) {
        for (const [, hex] of rampEntries(
          generateRamp({ seed, slot, reference: REFERENCE_RAMPS.red }),
        )) {
          expect(hex, `${seed} @ ${slot}`).toMatch(/^#[0-9a-f]{6}$/);
        }
      }
    }
  });

  it("carries the seed's hue across the whole ramp", () => {
    const ramp = generateRamp({
      seed: "#7c5cff",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    const seedHue = hexToOklch("#7c5cff").h;
    for (const slot of RAMP_SLOTS) {
      const { c, h } = hexToOklch(ramp[slot]);
      if (c < 0.02) continue; // near-achromatic ends carry no meaningful hue
      // Circular distance between the two hues, in degrees.
      const delta = Math.abs(((h - seedHue + 540) % 360) - 180);
      expect(delta, `slot ${slot} hue ${h} vs seed ${seedHue}`).toBeLessThan(25);
    }
  });

  it("keeps a grey seed grey", () => {
    const ramp = generateRamp({
      seed: "#7a7a7a",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    for (const slot of RAMP_SLOTS) {
      expect(hexToOklch(ramp[slot]).c, `slot ${slot}`).toBeLessThan(0.01);
    }
  });

  it("produces a duller ramp for a duller seed", () => {
    const vivid = generateRamp({
      seed: "#00b7ee",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    const muted = generateRamp({
      seed: "#4d7f8c",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    const meanChroma = (r: Ramp) =>
      RAMP_SLOTS.reduce((sum, s) => sum + hexToOklch(r[s]).c, 0) / RAMP_SLOTS.length;
    expect(meanChroma(muted)).toBeLessThan(meanChroma(vivid));
  });

  it("keeps the extremes near the reference's extremes for an ordinary seed", () => {
    const ramp = generateRamp({
      seed: "#7c5cff",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    // Tolerance is 8-bit quantisation of the output hex, not slack in the maths.
    expect(hexToOklch(ramp[5]).l).toBeCloseTo(hexToOklch(REFERENCE_RAMPS.primary[5]).l, 2);
    expect(hexToOklch(ramp[95]).l).toBeCloseTo(hexToOklch(REFERENCE_RAMPS.primary[95]).l, 2);
  });
});

describe("generateRamp — degenerate seeds", () => {
  it("collapses the shades above a white seed rather than folding the ramp", () => {
    const ramp = generateRamp({
      seed: "#ffffff",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    expect(ramp[40]).toBe("#ffffff");
    for (const slot of [50, 60, 70, 80, 90, 95] as RampSlot[]) {
      expect(ramp[slot], `slot ${slot}`).toBe("#ffffff");
    }
    // Below the seed the ramp still spreads out.
    expect(new Set([5, 10, 20, 30].map((s) => ramp[s as RampSlot])).size).toBe(4);
  });

  it("collapses the shades below a black seed", () => {
    const ramp = generateRamp({
      seed: "#000000",
      slot: 40,
      reference: REFERENCE_RAMPS.primary,
    });
    for (const slot of [5, 10, 20, 30, 40] as RampSlot[]) {
      expect(ramp[slot], `slot ${slot}`).toBe("#000000");
    }
    expect(hexToOklch(ramp[95]).l).toBeGreaterThan(0.9);
  });

  it("handles a fully saturated seed without leaving sRGB", () => {
    const ramp = generateRamp({
      seed: "#ff0000",
      slot: 50,
      reference: REFERENCE_RAMPS.red,
    });
    expect(ramp[50]).toBe("#ff0000");
    for (const slot of RAMP_SLOTS) {
      expect(ramp[slot]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("still produces colour when the reference slot is achromatic", () => {
    const greyReference = Object.fromEntries(
      RAMP_SLOTS.map((s, i) => {
        const v = Math.round((i / (RAMP_SLOTS.length - 1)) * 255);
        const c = v.toString(16).padStart(2, "0");
        return [s, `#${c}${c}${c}` as Hex];
      }),
    ) as Ramp;
    const ramp = generateRamp({ seed: "#c74a00", slot: 40, reference: greyReference });
    expect(ramp[40]).toBe("#c74a00");
    expect(hexToOklch(ramp[60]).c).toBeGreaterThan(0.02);
  });
});
