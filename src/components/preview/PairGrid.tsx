import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PreviewPairGridProps {
  className?: string
  children: ReactNode
}

/**
 * Two-column grid for a light panel and a dark panel.
 *
 * Below 768px the columns stack: light panel first, dark panel second.
 *
 * @example
 * <PreviewPairGrid>
 *   <PreviewPanel mode="light" vars={lightVars}>…</PreviewPanel>
 *   <PreviewPanel mode="dark" vars={darkVars}>…</PreviewPanel>
 * </PreviewPairGrid>
 */
export function PreviewPairGrid({ className, children }: PreviewPairGridProps) {
  // min-w-0: wide children shrink instead of widening the page.
  return (
    <div className={cn("grid min-w-0 grid-cols-2 gap-4 max-md:grid-cols-1", className)}>
      {children}
    </div>
  )
}
