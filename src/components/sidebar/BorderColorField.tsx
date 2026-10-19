import { Radio } from "@base-ui/react/radio"

import type { DerivedTheme, NeutralSlotId, ThemeConfig } from "@/engine"
import { cn } from "@/lib/utils"
import { FieldDescription } from "@/components/ui/field"
import { RadioGroup } from "@/components/ui/radio-group"
import { getBorderStepOptions, type BorderStepRender } from "@/components/sidebar/lib/border-steps"

function MiniCard({ light, dark }: { light: BorderStepRender; dark: BorderStepRender }) {
  return (
    <div
      aria-hidden="true"
      className="relative h-8.5 w-37.5 shrink-0 overflow-hidden rounded-md"
    >
      <div
        className="absolute inset-0 rounded-md"
        style={{
          backgroundColor: light.cardHex,
          border: `1px solid ${light.borderColor}`,
          boxShadow: light.boxShadow,
        }}
      />
      <div
        className="absolute inset-0 rounded-md"
        style={{
          backgroundColor: dark.cardHex,
          border: `1px solid ${dark.borderColor}`,
          boxShadow: dark.boxShadow,
          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
        }}
      />
    </div>
  )
}

interface BorderColorFieldProps {
  readonly config: ThemeConfig
  readonly theme: DerivedTheme
  readonly onChange: (value: NeutralSlotId | "match-card") => void
}

export function BorderColorField({ config, theme, onChange }: BorderColorFieldProps) {
  const options = getBorderStepOptions(theme)

  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        aria-label="Border color"
        value={config.borderColor}
        onValueChange={(value) => onChange(value as NeutralSlotId | "match-card")}
        className="flex flex-col gap-1.5"
      >
        {options.map((option) => (
          <Radio.Root
            key={option.value}
            value={option.value}
            aria-label={option.accessibleName}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg p-1 text-left outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <span
              aria-hidden="true"
              className="size-3.5 shrink-0 rounded-full border border-input group-data-checked:border-primary group-data-checked:bg-primary"
            />
            <span className="w-16 shrink-0 text-sm">{option.label}</span>
            <MiniCard light={option.light} dark={option.dark} />
          </Radio.Root>
        ))}
      </RadioGroup>
      <FieldDescription>
        Each option is a small card: real background, real border, real shadow. Light half
        top-left, dark half bottom-right.
      </FieldDescription>
    </div>
  )
}
