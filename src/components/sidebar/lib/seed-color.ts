import { getExtendedPalette, type ExtendedPaletteId, type Hex, type PaletteColorName } from "@/engine"

export type PaletteRef = `palette:${PaletteColorName}`
export type SeedColor = Hex | PaletteRef

const PALETTE_REF_PREFIX = "palette:"

export function isPaletteRef(seed: SeedColor): boolean {
  return seed.startsWith(PALETTE_REF_PREFIX)
}

export function paletteRefName(seed: SeedColor): PaletteColorName | null {
  if (!isPaletteRef(seed)) return null
  return seed.slice(PALETTE_REF_PREFIX.length) as PaletteColorName
}

export function paletteRef(name: PaletteColorName): SeedColor {
  return `${PALETTE_REF_PREFIX}${name}`
}

/** Resolves a `SeedColor` to the literal hex it currently means, given the active palette. */
export function resolveSeedColor(seed: SeedColor, paletteId: ExtendedPaletteId): Hex {
  const name = paletteRefName(seed)
  if (name === null) {
    return seed
  }
  return getExtendedPalette(paletteId).colors[name]
}
