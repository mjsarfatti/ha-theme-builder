import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { ThemeMode } from "@/engine"

interface PreviewPanelProps {
  mode: ThemeMode
  /** Output of `toCssProperties(theme, mode)`. */
  vars: CSSProperties
  className?: string
  children: ReactNode
}

/**
 * Scoped container that renders its children with one mode's theme.
 *
 * The variables apply to this element only. The background and border
 * come from the theme, so the panel itself shows the mode.
 *
 * @example
 * <PreviewPanel mode="dark" vars={toCssProperties(theme, "dark")}>
 *   <EntityTile />
 * </PreviewPanel>
 */
export function PreviewPanel({ mode, vars, className, children }: PreviewPanelProps) {
  return (
    <div
      data-preview-mode={mode}
      style={{
        ...vars,
        background: "var(--primary-background-color)",
        border: "1px solid var(--divider-color)",
        color: "var(--primary-text-color)",
        fontFamily: "var(--ha-font-family-body)",
      }}
      // Outline in the builder's border color: the theme divider can be transparent.
      className={cn(
        "min-w-0 rounded-xl p-4 outline outline-1 -outline-offset-1 outline-border/40",
        className,
      )}
    >
      {children}
    </div>
  )
}
