import { rampEntries } from "@/engine"
import { PreviewPanel } from "../Panel"
import { PresetSwatch } from "../PresetSwatch"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"

/**
 * UX-SPEC §4.4. Reads `theme.ramps.neutral` through `rampEntries()`, not the
 * raw 13-shade preset (`getNeutralRamp(id).ramp`) — the two are different
 * shapes, and `rampEntries()` only accepts the narrow 11-shade one
 * (§6.1 item 8).
 *
 * The ramp emits the same eleven hex values for light and dark, so this
 * renders once, full width, tagged `Both modes` (§1.2). The single panel
 * uses the light-mode variables for its own chrome (text, divider) — an
 * arbitrary but consistent choice, since the section has no single "mode" of
 * its own to prefer.
 */
export function NeutralRampSection({ theme, lightVars }: PreviewSectionProps) {
  const entries = rampEntries(theme.ramps.neutral)

  return (
    <PreviewSection
      id="neutral-ramp"
      title="Neutral ramp"
      description="The backbone of the theme. Every background, border and text color is a step on this ramp."
      bothModes
    >
      <PreviewPanel mode="light" vars={lightVars}>
        <div className="grid grid-cols-11 gap-1">
          {entries.map(([slot, hex]) => (
            <PresetSwatch key={slot} label={String(slot).padStart(2, "0")} hex={hex} />
          ))}
        </div>
      </PreviewPanel>
    </PreviewSection>
  )
}
