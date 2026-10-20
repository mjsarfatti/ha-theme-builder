import type { ReactNode } from "react"
import { TriangleAlertIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"

/** Inline notice about a low-contrast choice. It stays visible while the choice stands. */
export function ContrastWarning({ children }: { children: ReactNode }) {
  return (
    <Alert variant="default" className="py-2">
      <TriangleAlertIcon />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
