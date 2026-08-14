/**
 * Surfaces: the three constrained knobs (`docs/UX-SPEC.md` §3.2 group 4,
 * §2.5) — Card background, Primary background, Border color.
 */
import type { DerivedTheme, NeutralSlotId, SurfaceChoice, ThemeConfig } from "@/engine"
import { BorderColorField } from "@/components/sidebar/BorderColorField"
import { SidebarField } from "@/components/sidebar/SidebarField"
import { SurfaceSwatchField } from "@/components/sidebar/SurfaceSwatchField"

interface SurfacesGroupProps {
  readonly config: ThemeConfig
  readonly theme: DerivedTheme
  readonly onChangeCardBackground: (value: SurfaceChoice) => void
  readonly onChangePrimaryBackground: (value: SurfaceChoice) => void
  readonly onChangeBorderColor: (value: NeutralSlotId | "match-card") => void
}

export function SurfacesGroup({
  config,
  theme,
  onChangeCardBackground,
  onChangePrimaryBackground,
  onChangeBorderColor,
}: SurfacesGroupProps) {
  return (
    <div className="flex flex-col gap-4">
      <SidebarField label="Card background">
        <SurfaceSwatchField
          ariaLabel="Card background"
          value={config.cardBackground}
          neutralRamp={config.neutralRamp}
          onChange={onChangeCardBackground}
        />
      </SidebarField>
      <SidebarField label="Primary background">
        <SurfaceSwatchField
          ariaLabel="Primary background"
          value={config.primaryBackground}
          neutralRamp={config.neutralRamp}
          onChange={onChangePrimaryBackground}
        />
      </SidebarField>
      <SidebarField label="Border color">
        <BorderColorField config={config} theme={theme} onChange={onChangeBorderColor} />
      </SidebarField>
    </div>
  )
}
