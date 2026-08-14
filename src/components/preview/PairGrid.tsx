import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PreviewPairGridProps {
  className?: string
  children: ReactNode
}

/**
 * The two-column grid a paired section (light panel left, dark panel right)
 * renders into. Below 768px viewport width the columns stack, light above
 * dark (UX-SPEC §1.5) — both modes stay visible, the reader scrolls between
 * them instead of the layout hiding one. `min-w-0` on the grid keeps a wide
 * child (a long hex string, an 11-swatch strip) from forcing the grid itself
 * to overflow: the two-column preview MUST NOT produce a horizontal
 * scrollbar at any width (§1.5).
 */
export function PreviewPairGrid({ className, children }: PreviewPairGridProps) {
  return (
    <div className={cn("grid min-w-0 grid-cols-2 gap-4 max-md:grid-cols-1", className)}>
      {children}
    </div>
  )
}
