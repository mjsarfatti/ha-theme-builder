import type { CSSProperties } from "react"

import type { DerivedTheme } from "@/engine"

/**
 * Props shared by every preview section.
 *
 * `lightVars` and `darkVars` come from `toCssProperties(theme, mode)`.
 * Each panel applies them as its scoped style.
 */
export interface PreviewSectionProps {
  theme: DerivedTheme
  lightVars: CSSProperties
  darkVars: CSSProperties
}
