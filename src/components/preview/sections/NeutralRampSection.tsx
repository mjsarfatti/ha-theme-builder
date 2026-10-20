import { rampEntries } from "@/engine"
import { PreviewPanel } from "../Panel"
import { PresetSwatch } from "../PresetSwatch"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"

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
