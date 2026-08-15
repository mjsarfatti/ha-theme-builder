import { modeVars, PALETTE_COLOR_NAMES, type PaletteColorName } from "@/engine"
import { PreviewPanel } from "../Panel"
import { PresetSwatch } from "../PresetSwatch"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"

/** `"deep-purple"` → `"Deep purple"`, `"blue-grey"` → `"Blue grey"`. */
function paletteColorLabel(name: PaletteColorName): string {
  const [first, ...rest] = name.split("-")
  return [first.charAt(0).toUpperCase() + first.slice(1), ...rest].join(" ")
}

/**
 * UX-SPEC §4.5. Reads the palette values out of `modeVars(theme, "light")`
 * under the `{name}-color` keys, in `PALETTE_COLOR_NAMES` order (§6.1 item
 * 8) — these eighteen colors are mode-independent, so "light" is only a
 * fixed argument to `modeVars`, not a claim about which mode this section
 * represents. Renders once, full width, tagged `Both modes` (§1.2), 18
 * swatches, 6 across (§4.5).
 */
export function EntityColorsSection({ theme, lightVars }: PreviewSectionProps) {
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
