/**
 * The warn-never-block contrast notice (`docs/UX-SPEC.md` §5.3). Informational,
 * never a toast — a toast is for something that already happened, and this is
 * a standing fact about the current choice.
 */
import type { ReactNode } from "react"
import { TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"

export function ContrastWarning({ children }: { children: ReactNode }) {
  return (
    <Alert variant="default" className="py-2">
      <TriangleAlertIcon />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
