/**
 * Brand & status colors: six popover pickers (`docs/UX-SPEC.md` §3.2 group
 * 2), in the spec's own fixed order.
 */
import { DEFAULT_CONFIG, type ExtendedPaletteId, type ThemeConfig } from "@/engine"
import { FieldDescription } from "@/components/ui/field"
import { ColorPickerField } from "@/components/sidebar/ColorPickerField"
import { SidebarField } from "@/components/sidebar/SidebarField"
import type { UseRecentColorsResult } from "@/components/sidebar/hooks/use-recent-colors"
import type { SeedColor } from "@/components/sidebar/lib/seed-color"

const COLOR_FIELDS: readonly { key: keyof ThemeConfig["colors"]; label: string }[] = [
  { key: "primary", label: "Primary color" },
  { key: "accent", label: "Accent color" },
  { key: "error", label: "Error color" },
  { key: "warning", label: "Warning color" },
  { key: "success", label: "Success color" },
  { key: "info", label: "Info color" },
]

interface BrandStatusGroupProps {
  readonly colors: ThemeConfig["colors"]
  readonly palette: ExtendedPaletteId
  readonly recentColors: UseRecentColorsResult
  readonly onChange: (key: keyof ThemeConfig["colors"], value: SeedColor) => void
}

export function BrandStatusGroup({
  colors,
  palette,
  recentColors,
  onChange,
}: BrandStatusGroupProps) {
  return (
    <SidebarField label="Brand & status colors">
      <div className="flex flex-col gap-2">
        {COLOR_FIELDS.map(({ key, label }) => (
          <ColorPickerField
            key={key}
            label={label}
            value={colors[key]}
            defaultValue={DEFAULT_CONFIG.colors[key]}
            paletteId={palette}
            recentColors={recentColors}
            onChange={(value) => onChange(key, value)}
          />
        ))}
      </div>
      <FieldDescription>
        Each of these seeds a full ramp. You pick one shade. The rest are generated.
      </FieldDescription>
    </SidebarField>
  )
}
