/**
 * The 4-swatch row shared by Card background and Primary background
 * (`docs/UX-SPEC.md` §2.5). `SurfaceChoice` is a type-only union in
 * `src/engine/types.ts` — the engine exports no runtime array for it (unlike
 * `RAMP_SLOTS`), so the four options are listed here and pinned to the type
 * with `satisfies`, so a future widening of the union fails typecheck
 * instead of silently going unlisted.
 */
import { Radio } from "@base-ui/react/radio"
import { CheckIcon } from "lucide-react"

import { contrastingText, getNeutralRamp, type NeutralRampId, type SurfaceChoice } from "@/engine"
import { cn } from "@/lib/utils"
import { FieldDescription } from "@/components/ui/field"
import { RadioGroup } from "@/components/ui/radio-group"

// `slot` keeps its number *literal* type via `as const`, so it indexes
// `NeutralRamp` (a `Record` of specific slot literals, not `Record<number,
// Hex>`) without a cast.
const SURFACE_STEPS = [
  { choice: "neutral-80", slot: 80 },
  { choice: "neutral-90", slot: 90 },
  { choice: "neutral-95", slot: 95 },
  { choice: "neutral-100", slot: 100 },
] as const satisfies readonly { choice: SurfaceChoice; slot: number }[]

function choiceLabel(slot: number): string {
  return `Neutral ${slot}`
}

interface SurfaceSwatchFieldProps {
  readonly value: SurfaceChoice
  readonly neutralRamp: NeutralRampId
  readonly ariaLabel: string
  readonly onChange: (value: SurfaceChoice) => void
}

export function SurfaceSwatchField({
  value,
  neutralRamp,
  ariaLabel,
  onChange,
}: SurfaceSwatchFieldProps) {
  const ramp = getNeutralRamp(neutralRamp).ramp

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        aria-label={ariaLabel}
        value={value}
        onValueChange={(next) => onChange(next as SurfaceChoice)}
        className="grid grid-cols-4 gap-2"
      >
        {SURFACE_STEPS.map(({ choice, slot }) => {
          const hex = ramp[slot]
          return (
            <Radio.Root
              key={choice}
              value={choice}
              aria-label={choiceLabel(slot)}
              className={cn(
                "group flex flex-col items-center gap-1 rounded-lg p-1 text-center outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              <span
                aria-hidden="true"
                className="relative flex h-9 w-full items-center justify-center rounded-md ring-1 ring-inset ring-black/12 group-data-checked:ring-2 group-data-checked:ring-ring"
                style={{ backgroundColor: hex }}
              >
                <Radio.Indicator>
                  <CheckIcon
                    aria-hidden="true"
                    className="size-4"
                    style={{ color: contrastingText(hex) }}
                  />
                </Radio.Indicator>
              </span>
              <span className="text-xs text-muted-foreground">{choiceLabel(slot)}</span>
            </Radio.Root>
          )
        })}
      </RadioGroup>
      <FieldDescription>Dark mode uses the matching dark shade automatically.</FieldDescription>
    </div>
  )
}
