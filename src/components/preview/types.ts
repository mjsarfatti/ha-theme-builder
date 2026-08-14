import type { CSSProperties } from "react"

import type { DerivedTheme } from "@/engine"

/**
 * Props every preview section takes. `lightVars` / `darkVars` are
 * `toCssProperties(theme, mode)`, computed once in `Preview.tsx` and passed
 * down so each of the (up to) two panels a section renders applies the same
 * object instead of recomputing it. See `src/engine/README.md` on why the
 * scoped container's style always comes from `toCssProperties` / `modeVars`,
 * never from `theme.light` / `theme.dark` directly — those two maps are
 * partial and disjoint, and neither alone carries the mode-independent
 * variables every panel also needs.
 */
export interface PreviewSectionProps {
  theme: DerivedTheme
  lightVars: CSSProperties
  darkVars: CSSProperties
}
