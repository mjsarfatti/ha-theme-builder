/**
 * `SeedColor` helpers for the six popover-driven knobs (`docs/UX-SPEC.md`
 * §2.7 Change 1). A `SeedColor` is a literal hex or a `"palette:<name>"`
 * reference that follows the entity-palette preset — see `src/engine/types.ts`.
 *
 * `SeedColor` and `PaletteRef` are documented in `src/engine/README.md` and
 * used internally by `derive.ts`, but `src/engine/index.ts`'s barrel does
 * not re-export either one — only `ThemeConfig` (whose `colors.*` fields are
 * typed `SeedColor`) crosses that boundary. `src/engine/` is frozen (M4's
 * brief, CLAUDE.md), so rather than add the export there, this module
 * declares the identical shape locally. It is structurally the same type as
 * the engine's own — both resolve to `Hex | \`palette:${PaletteColorName}\``
 * — so a `ThemeConfig.colors.*` value assigns here with no cast needed.
 * Flagged in the PR body as a one-line gap the engine owner may want to
 * backport into the barrel.
 */
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
