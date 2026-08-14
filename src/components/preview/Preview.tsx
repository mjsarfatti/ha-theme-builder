import { useMemo, type CSSProperties } from "react"

import { TooltipProvider } from "@/components/ui/tooltip"
import { toCssProperties, type DerivedTheme } from "@/engine"
import { BrandStatusSection } from "./sections/BrandStatusSection"
import { EntityColorsSection } from "./sections/EntityColorsSection"
import { LivingRoomSection } from "./sections/LivingRoomSection"
import { NeutralRampSection } from "./sections/NeutralRampSection"
import { SurfacesSection } from "./sections/SurfacesSection"
import { TextTypeSection } from "./sections/TextTypeSection"

export interface PreviewProps {
  theme: DerivedTheme
}

/**
 * The whole preview pane (UX-SPEC §1, §6.1). Stateless: it reads no global
 * state and owns no state beyond local UI state such as a tooltip. `theme`
 * is the only input, and every section renders from it.
 *
 * `lightVars` / `darkVars` are computed once per theme change and handed to
 * every section, so each of the (up to) ten panels below applies the same
 * object to its own `style` instead of recomputing `toCssProperties`.
 */
export function Preview({ theme }: PreviewProps) {
  const lightVars = useMemo(() => toCssProperties(theme, "light") as CSSProperties, [theme])
  const darkVars = useMemo(() => toCssProperties(theme, "dark") as CSSProperties, [theme])

  const sectionProps = { theme, lightVars, darkVars }

  return (
    <TooltipProvider>
      <div className="@container/preview flex min-w-0 flex-col gap-10 p-6">
        <LivingRoomSection {...sectionProps} />
        <SurfacesSection {...sectionProps} />
        <TextTypeSection {...sectionProps} />
        <BrandStatusSection {...sectionProps} />
        <NeutralRampSection {...sectionProps} />
        <EntityColorsSection {...sectionProps} />
      </div>
    </TooltipProvider>
  )
}
