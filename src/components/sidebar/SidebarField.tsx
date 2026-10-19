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
