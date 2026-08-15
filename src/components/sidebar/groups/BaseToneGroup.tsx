/**
 * Base tone: the neutral-ramp preset picker (`docs/UX-SPEC.md` §3.2 group 3,
 * §3.3). Also carries the one cross-knob contrast warning that lives outside
 * a popover (§5.3): secondary text against the card background.
 */
import { contrastRatio, NEUTRAL_RAMPS, type DerivedTheme, type NeutralRampId } from "@/engine"
import { FieldDescription } from "@/components/ui/field"
import { ContrastWarning } from "@/components/sidebar/ContrastWarning"
import { SidebarField } from "@/components/sidebar/SidebarField"
import {
  PresetStripList,
  type CompareAllColumn,
  type CompareAllRow,
} from "@/components/sidebar/PresetStripList"
import { sidebarPresetLabel } from "@/components/sidebar/lib/preset-label"

const CONTRAST_WARNING_THRESHOLD = 4.5

// The sidebar strip stays at 11 shades (§4.4, §6.1 item 8) — the same
// `rampEntries()` order, dark to light.
const STRIP_SLOTS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const

// `as const` keeps each slot number a literal, so it indexes `NeutralRamp`
// (a `Record` of specific slot literals) without a cast.
const NEUTRAL_RAMP_STEP_LABELS = [
  [0, "neutral-00"],
  [5, "neutral-05"],
  [10, "neutral-10"],
  [20, "neutral-20"],
  [30, "neutral-30"],
  [40, "neutral-40"],
  [50, "neutral-50"],
  [60, "neutral-60"],
  [70, "neutral-70"],
  [80, "neutral-80"],
  [90, "neutral-90"],
  [95, "neutral-95"],
  [100, "neutral-100"],
] as const

const COMPARE_COLUMNS: readonly CompareAllColumn[] = NEUTRAL_RAMPS.map((preset) => ({
  id: preset.id,
  label: preset.label,
}))

// The base-tone dialog is the one place that shows all 13 shades, read from
// the raw preset — `theme.ramps.neutral` is narrowed to 11 and does not
// carry `neutral-00`/`neutral-100` (§3.3, §6.1 item 8).
const COMPARE_ROWS: readonly CompareAllRow[] = NEUTRAL_RAMP_STEP_LABELS.map(([slot, label]) => ({
  label,
  cells: Object.fromEntries(NEUTRAL_RAMPS.map((preset) => [preset.id, preset.ramp[slot]])),
}))

interface BaseToneGroupProps {
  readonly neutralRamp: NeutralRampId
  readonly theme: DerivedTheme
  readonly onChange: (id: NeutralRampId) => void
}

export function BaseToneGroup({ neutralRamp, theme, onChange }: BaseToneGroupProps) {
  // Every row needs its *own* preset's swatches, not the currently-selected
  // one repeated — `rampEntries` only accepts the narrow 11-shade `Ramp`
  // shape `theme.ramps.neutral` carries for the *selected* preset, so each
  // row reads its 11 shades straight from that preset's own raw `.ramp`.
  const items = NEUTRAL_RAMPS.map((preset) => ({
    id: preset.id,
    label: sidebarPresetLabel(preset.label),
    swatches: STRIP_SLOTS.map((slot) => preset.ramp[slot]),
  }))

  const lightRatio = contrastRatio(
    theme.light["secondary-text-color"],
    theme.light["card-background-color"]
  )
  const darkRatio = contrastRatio(
    theme.dark["secondary-text-color"],
    theme.dark["card-background-color"]
  )
  const showContrastWarning =
    lightRatio < CONTRAST_WARNING_THRESHOLD || darkRatio < CONTRAST_WARNING_THRESHOLD

  return (
    <SidebarField label="Base tone">
      <PresetStripList
        ariaLabel="Base tone"
        items={items}
        value={neutralRamp}
        onChange={(id) => onChange(id as NeutralRampId)}
        compareTitle="Compare all base tones"
        compareColumns={COMPARE_COLUMNS}
        compareRows={COMPARE_ROWS}
      />
      <FieldDescription>Every background, border and text color comes from this ramp.</FieldDescription>
      {showContrastWarning ? (
        <ContrastWarning>
          Secondary text is low contrast in dark mode with this base tone.
        </ContrastWarning>
      ) : null}
    </SidebarField>
  )
}
