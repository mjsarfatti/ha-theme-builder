import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PreviewSectionProps {
  id: string
  title: string
  description: string
  bothModes?: boolean
  children: ReactNode
}

export function PreviewSection({ id, title, description, bothModes, children }: PreviewSectionProps) {
  const headingId = `${id}-heading`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 id={headingId} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {title}
          </h2>
          {bothModes ? <Badge variant="secondary">Both modes</Badge> : null}
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
