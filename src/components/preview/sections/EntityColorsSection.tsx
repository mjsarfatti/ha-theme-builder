import { modeVars, PALETTE_COLOR_NAMES, type PaletteColorName } from "@/engine"
import { PreviewPanel } from "../Panel"
import { PresetSwatch } from "../PresetSwatch"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"

function paletteColorLabel(name: PaletteColorName): string {
  const [first, ...rest] = name.split("-")
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ")
}

export function EntityColorsSection({ theme, lightVars }: PreviewSectionProps) {
  // Palette colors are equal in both modes.
  const values = modeVars(theme, "light")

  return (
    <PreviewSection
      id="entity-colors"
      title="Entity colors"
      description="These color entity icons and badges — a light is amber, a lock is red."
      bothModes
    >
      <PreviewPanel mode="light" vars={lightVars}>
        <div className="grid grid-cols-6 gap-3">
          {PALETTE_COLOR_NAMES.map((name) => (
            <PresetSwatch key={name} label={paletteColorLabel(name)} hex={values[`${name}-color`]} />
          ))}
        </div>
      </PreviewPanel>
    </PreviewSection>
  )
}
