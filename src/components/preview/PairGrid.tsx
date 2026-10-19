import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface PreviewPairGridProps {
  className?: string
  children: ReactNode
}

export function PreviewPairGrid({ className, children }: PreviewPairGridProps) {
  return (
    <div className={cn("grid min-w-0 grid-cols-2 gap-4 max-md:grid-cols-1", className)}>
      {children}
    </div>
  )
}
