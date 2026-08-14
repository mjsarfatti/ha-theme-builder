/**
 * A `radiogroup` of small circular color swatches — the popover's entity-
 * palette group and Recent row (`docs/UX-SPEC.md` §2.3). `Radio.Root` is
 * Base UI's own primitive, the same one `@/components/ui/radio-group`
 * re-exports as `RadioGroupItem` — used directly here (not through that
 * wrapper) because a swatch's look is a filled circle, not the dot-in-ring
 * shadcn ships. Roving tabindex, arrow-key navigation and `role="radio"`
 * come from the primitive either way.
 */
import { Radio } from "@base-ui/react/radio"
import { CheckIcon } from "lucide-react"

import { contrastingText, type Hex } from "@/engine"
import { cn } from "@/lib/utils"
import { RadioGroup } from "@/components/ui/radio-group"

export interface ColorSwatchItem {
  readonly key: string
  readonly hex: Hex
  /** Human name announced to assistive tech, e.g. `"Amber"` or the raw hex for Recent. */
  readonly name: string
}

interface ColorSwatchGroupProps {
  readonly ariaLabel: string
  readonly items: readonly ColorSwatchItem[]
  /** The current resolved hex. A swatch matching it (case-insensitive) shows as selected. */
  readonly selectedHex: Hex | null
  readonly onSelect: (item: ColorSwatchItem) => void
  readonly className?: string
  /** Marks the list so an open popover elsewhere can tell a click here isn't an outside press (§2.3). */
  readonly presetListMarker?: boolean
}

export function ColorSwatchGroup({
  ariaLabel,
  items,
  selectedHex,
  onSelect,
  className,
  presetListMarker,
}: ColorSwatchGroupProps) {
  if (items.length === 0) return null

  const selectedKey =
    selectedHex !== null
      ? (items.find((item) => item.hex.toLowerCase() === selectedHex.toLowerCase())?.key ?? null)
      : null

  return (
    <RadioGroup
      aria-label={ariaLabel}
      value={selectedKey}
      onValueChange={(key) => {
        const item = items.find((candidate) => candidate.key === key)
        if (item) onSelect(item)
      }}
      data-preset-list={presetListMarker ? "" : undefined}
      className={cn("grid grid-cols-9 gap-1.5", className)}
    >
      {items.map((item) => (
        <Radio.Root
          key={item.key}
          value={item.key}
          aria-label={`${item.name}, ${item.hex}`}
          title={`${item.name} · ${item.hex}`}
          className={cn(
            "relative size-6 shrink-0 rounded-full ring-1 ring-inset ring-black/12 outline-none",
            "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring",
            "data-checked:ring-2 data-checked:ring-offset-1 data-checked:ring-ring"
          )}
          style={{ backgroundColor: item.hex }}
        >
          <Radio.Indicator className="flex size-full items-center justify-center">
            <CheckIcon
              aria-hidden="true"
              className="size-3.5"
              style={{ color: contrastingText(item.hex) }}
            />
          </Radio.Indicator>
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}
