/**
 * Home Assistant's own hue ramps, transcribed verbatim from
 * `.references/template.css` (which mirrors HA's `color/core.globals.ts`).
 *
 * These serve two jobs:
 * 1. They are the *shape references* `generateRamp()` transfers onto a user
 *    seed — the lightness/chroma profile of each family.
 * 2. They are the fallback output when the user leaves a seed at its default,
 *    which is what makes the default config reproduce HA byte for byte.
 *
 * `KNOB_SLOT` records which shade of each family is the user-facing control,
 * per the `KNOB` annotations in `template.css`.
 */
import type { Ramp, RampSlot } from "../types.ts";

/** `--ha-color-primary-*`; knob at 40 ("Primary color"). */
export const HA_PRIMARY_RAMP: Ramp = {
  5: "#001721",
  10: "#002e3e",
  20: "#004156",
  30: "#006787",
  40: "#009ac7",
  50: "#18bcf2",
  60: "#37c8fd",
  70: "#7bd4fb",
  80: "#b9e6fc",
  90: "#dff3fc",
  95: "#eff9fe",
};

/** `--ha-color-orange-*`; knob at 70 ("Warning color"). */
export const HA_ORANGE_RAMP: Ramp = {
  5: "#280700",
  10: "#3b0f00",
  20: "#5e1c00",
  30: "#7e2900",
  40: "#9d3800",
  50: "#c94e00",
  60: "#f36d00",
  70: "#ff9342",
  80: "#ffbb89",
  90: "#ffe0c8",
  95: "#fff0e4",
};

/** `--ha-color-red-*`; knob at 50 ("Error color"). */
export const HA_RED_RAMP: Ramp = {
  5: "#2a040b",
  10: "#3e0913",
  20: "#631323",
  30: "#8a132c",
  40: "#b30532",
  50: "#dc3146",
  60: "#f3676c",
  70: "#fd8f90",
  80: "#ffb8b6",
  90: "#ffdedc",
  95: "#fff0ef",
};

/** `--ha-color-green-*`; knob at 60 ("Success color"). */
export const HA_GREEN_RAMP: Ramp = {
  5: "#031608",
  10: "#052310",
  20: "#0a3a1d",
  30: "#0a5027",
  40: "#036730",
  50: "#00883c",
  60: "#00ac49",
  70: "#5dc36f",
  80: "#93da98",
  90: "#c2f2c1",
  95: "#e3f9e3",
};

export const REFERENCE_RAMPS = {
  primary: HA_PRIMARY_RAMP,
  orange: HA_ORANGE_RAMP,
  red: HA_RED_RAMP,
  green: HA_GREEN_RAMP,
} as const;

/** The slot each family's knob controls, per `template.css`. */
export const KNOB_SLOT = {
  primary: 40,
  orange: 70,
  red: 50,
  green: 60,
} as const satisfies Record<keyof typeof REFERENCE_RAMPS, RampSlot>;
