/**
 * Entity colors: the extended-palette preset picker (`docs/UX-SPEC.md` §3.2
 * group 5, §3.3). `template.css` still calls this knob "Home Assistant
 * colors" — only the sidebar label changed (§7, O-2); `EXTENDED_PALETTES`
 * and the CSS variables it feeds keep their engine names.
 */
import { EXTENDED_PALETTES, PALETTE_COLOR_NAMES, type ExtendedPaletteId } from "@/engine"
import { FieldDescription } from "@/components/ui/field"
import { SidebarField } from "@/components/sidebar/SidebarField"
import {
  PresetStripList,
  type CompareAllColumn,
  type CompareAllRow,
} from "@/components/sidebar/PresetStripList"

function paletteColorRowLabel(name: string): string {
  const spaced = name.replace(/-/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

const COMPARE_COLUMNS: readonly CompareAllColumn[] = EXTENDED_PALETTES.map((preset) => ({
  id: preset.id,
  label: preset.label,
}))

const COMPARE_ROWS: readonly CompareAllRow[] = PALETTE_COLOR_NAMES.map((name) => ({
  label: paletteColorRowLabel(name),
  cells: Object.fromEntries(EXTENDED_PALETTES.map((preset) => [preset.id, preset.colors[name]])),
}))

const ITEMS = EXTENDED_PALETTES.map((preset) => ({
  id: preset.id,
  label: preset.label,
  swatches: PALETTE_COLOR_NAMES.map((name) => preset.colors[name]),
}))

interface EntityColorsGroupProps {
  readonly palette: ExtendedPaletteId
  readonly onChange: (id: ExtendedPaletteId) => void
}

export function EntityColorsGroup({ palette, onChange }: EntityColorsGroupProps) {
  return (
    <SidebarField label="Entity colors">
      <PresetStripList
        ariaLabel="Entity colors"
        items={ITEMS}
        value={palette}
        onChange={(id) => onChange(id as ExtendedPaletteId)}
        compareTitle="Compare all entity color palettes"
        compareColumns={COMPARE_COLUMNS}
        compareRows={COMPARE_ROWS}
      />
      <FieldDescription>
        These color entity icons and badges — a light is amber, a lock is red.
      </FieldDescription>
    </SidebarField>
  )
}
