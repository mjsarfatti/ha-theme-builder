import type { ReactNode } from "react"

import { FieldLegend, FieldSet } from "@/components/ui/field"

/** One knob: a label over its control, grouped as a `FieldSet`. */
export function SidebarField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <FieldSet className="gap-2">
      <FieldLegend variant="label">{label}</FieldLegend>
      {children}
    </FieldSet>
  )
}
