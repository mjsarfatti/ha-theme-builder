import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PreviewSectionProps {
  id: string
  title: string
  description: string
  /** Shows the "Both modes" badge for sections that look the same in both modes. */
  bothModes?: boolean
  children: ReactNode
}

/**
 * Section chrome: a title, a rule and a one-line description.
 *
 * The chrome uses the builder's own tokens, so theme variables never
 * restyle it.
 *
 * @example
 * <PreviewSection id="surfaces" title="Surfaces" description="…">
 *   {panels}
 * </PreviewSection>
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
