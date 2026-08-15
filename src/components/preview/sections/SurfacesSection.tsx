import { modeVars, type CssVarMap } from "@/engine"
import { PreviewPairGrid } from "../PairGrid"
import { PreviewPanel } from "../Panel"
import { PreviewSection } from "../PreviewSection"
import { SwatchCaption } from "../SwatchCaption"
import type { PreviewSectionProps } from "../types"

const TILES = [
  { label: "Primary background", key: "primary-background-color" },
  { label: "Card background", key: "card-background-color" },
  { label: "Secondary background", key: "secondary-background-color" },
] as const

/** UX-SPEC §4.1. */
export function SurfacesSection({ theme, lightVars, darkVars }: PreviewSectionProps) {
  const light = modeVars(theme, "light")
  const dark = modeVars(theme, "dark")

  return (
    <PreviewSection
      id="surfaces"
      title="Surfaces & dividers"
      description="The backgrounds cards sit on, and the line between them."
    >
      <PreviewPairGrid>
        <PreviewPanel mode="light" vars={lightVars}>
          <SurfaceTiles values={light} />
        </PreviewPanel>
        <PreviewPanel mode="dark" vars={darkVars}>
          <SurfaceTiles values={dark} />
        </PreviewPanel>
      </PreviewPairGrid>
    </PreviewSection>
  )
}

function SurfaceTiles({ values }: { values: CssVarMap }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TILES.map((tile) => (
        <div
          key={tile.key}
          className="flex h-[180px] flex-col justify-end rounded-lg p-3"
          style={{ background: `var(--${tile.key})`, border: "1px solid var(--divider-color)" }}
        >
          <SwatchCaption label={tile.label} hex={values[tile.key]} />
        </div>
      ))}
      <DividerTile hex={values["divider-color"]} />
    </div>
  )
}

/** Renders as a card with a hairline rule across it, not a solid fill — a
 * solid block of a 12%-alpha value misleads the reader about what the knob
 * does (§4.1). */
function DividerTile({ hex }: { hex?: string }) {
  return (
    <div
      className="relative flex h-[180px] flex-col justify-end rounded-lg p-3"
      style={{ background: "var(--card-background-color)", border: "1px solid var(--divider-color)" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2"
        style={{ background: "var(--divider-color)" }}
      />
      <SwatchCaption label="Divider" hex={hex} />
    </div>
  )
}
