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

/** Contrast ratio below which secondary text on the card shows a warning (WCAG AA). */
const CONTRAST_WARNING_THRESHOLD = 4.5

const STRIP_SLOTS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95] as const

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

// The dialog reads the raw 13-shade preset: `theme.ramps.neutral` lacks neutral-00 and neutral-100.
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
  // Each row shows its own preset's ramp, taken from the raw preset.
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
