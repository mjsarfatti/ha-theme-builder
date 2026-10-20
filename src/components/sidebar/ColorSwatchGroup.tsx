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
  /** Sets `data-preset-list`, so the color popover treats a click here as inside. */
  readonly presetListMarker?: boolean
}

/**
 * Radio group of small round color swatches.
 *
 * Base UI's `Radio.Root` supplies the radio semantics and the arrow-key
 * navigation. A swatch shows a check mark when it matches `selectedHex`.
 *
 * @example
 * <ColorSwatchGroup ariaLabel="Recent" items={items} selectedHex={hex} onSelect={pick} />
 */
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
