/** Barrel for the engine's static preset data. */
import type {
  ExtendedPaletteId,
  ExtendedPalettePreset,
  NeutralRampId,
  NeutralRampPreset,
} from "../types.ts";
import { NEUTRAL_RAMPS } from "./neutral-ramps.ts";
import { EXTENDED_PALETTES } from "./palettes.ts";

export { FONTS, FONT_CATEGORY_LABELS, getFont } from "./fonts.ts";
export { NEUTRAL_RAMPS } from "./neutral-ramps.ts";
export { EXTENDED_PALETTES, PALETTE_COLOR_NAMES } from "./palettes.ts";
export {
  HA_GREEN_RAMP,
  HA_ORANGE_RAMP,
  HA_PRIMARY_RAMP,
  HA_RED_RAMP,
  KNOB_SLOT,
  REFERENCE_RAMPS,
} from "./reference-ramps.ts";

const RAMPS_BY_ID = new Map(NEUTRAL_RAMPS.map((r) => [r.id, r]));
const PALETTES_BY_ID = new Map(EXTENDED_PALETTES.map((p) => [p.id, p]));

export function getNeutralRamp(id: NeutralRampId): NeutralRampPreset {
  const preset = RAMPS_BY_ID.get(id);
  if (!preset) throw new RangeError(`Unknown neutral ramp: ${JSON.stringify(id)}`);
  return preset;
}

export function getExtendedPalette(id: ExtendedPaletteId): ExtendedPalettePreset {
  const preset = PALETTES_BY_ID.get(id);
  if (!preset) throw new RangeError(`Unknown palette: ${JSON.stringify(id)}`);
  return preset;
}
