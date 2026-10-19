import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { ThemeMode } from "@/engine"

interface PreviewPanelProps {
  mode: ThemeMode
  /** `toCssProperties(theme, mode)`. Never `theme.light` / `theme.dark` alone. */
  vars: CSSProperties
  className?: string
  children: ReactNode
}

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
      className={cn(
        "min-w-0 rounded-xl p-4 outline outline-1 -outline-offset-1 outline-border/40",
        className,
      )}
    >
      {children}
    </div>
  )
}
