import type { CSSProperties } from "react"

import type { DerivedTheme } from "@/engine"

export interface PreviewSectionProps {
  theme: DerivedTheme
  lightVars: CSSProperties
  darkVars: CSSProperties
}
