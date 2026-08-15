/**
 * One knob's row: a label over its control, in the `FieldSet` + `FieldLegend`
 * composition shadcn's own rules call for when grouping related radios or
 * swatches — never a bare `div` with a heading.
 */
import type { ReactNode } from "react"

import { FieldLegend, FieldSet } from "@/components/ui/field"

export function SidebarField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <FieldSet className="gap-2">
      <FieldLegend variant="label">{label}</FieldLegend>
      {children}
    </FieldSet>
  )
}
