import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PreviewSectionProps {
  id: string
  title: string
  description: string
  /** Renders the `Both modes` badge (UX-SPEC §1.2) — for the two sections
   * whose values do not differ between light and dark. */
  bothModes?: boolean
  children: ReactNode
}

/**
 * The chrome every preview section shares (UX-SPEC §1.3, §6.1 item 5): a
 * small uppercase label, a hairline rule across the full preview width, and
 * a one-line description of what the section controls. This chrome is
 * builder UI, not preview content — it styles itself with the builder's own
 * tokens (`text-muted-foreground`, `Separator`), not a theme variable.
 */
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
