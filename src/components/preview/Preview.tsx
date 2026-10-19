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

export function Preview({ theme }: PreviewProps) {
  const lightVars = useMemo(() => toCssProperties(theme, "light") as CSSProperties, [theme])
  const darkVars = useMemo(() => toCssProperties(theme, "dark") as CSSProperties, [theme])

  const sectionProps = { theme, lightVars, darkVars }

  return (
    <TooltipProvider>
      <main className="min-w-0 flex-1 overflow-y-auto bg-muted/30">
        <div className="@container/preview flex min-w-0 flex-col gap-10 p-6">
          <LivingRoomSection {...sectionProps} />
          <SurfacesSection {...sectionProps} />
          <TextTypeSection {...sectionProps} />
          <BrandStatusSection {...sectionProps} />
          <NeutralRampSection {...sectionProps} />
          <EntityColorsSection {...sectionProps} />
        </div>
      </main>
    </TooltipProvider>
  )
}
