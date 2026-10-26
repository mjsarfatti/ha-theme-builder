import { mdiAlertCircleOutline, mdiAlertOutline } from "@mdi/js"

import { MdiIcon } from "./MdiIcon"

const SEVERITY = {
  warning: { icon: mdiAlertOutline, colorVar: "warning-color" },
  error: { icon: mdiAlertCircleOutline, colorVar: "error-color" },
} as const

interface ErrorCardProps {
  severity: keyof typeof SEVERITY
  title: string
}

/**
 * Mock of the dashboard card that HA shows for a broken or missing entity.
 *
 * It copies `hui-error-card.ts`: a borderless card with the severity
 * color at 0.12 opacity over the card background, and an icon in the
 * severity color. `hui-warning` is the same card with `severity="warning"`.
 *
 * @example
 * <ErrorCard severity="warning" title="Entity not available: light.porch" />
 */
export function ErrorCard({ severity, title }: ErrorCardProps) {
  const { icon, colorVar } = SEVERITY[severity]

  return (
    <div
      className="relative flex items-center gap-2 overflow-hidden rounded-xl p-4"
      style={{ background: "var(--card-background-color)", color: `var(--${colorVar})` }}
    >
      <span aria-hidden="true" className="absolute inset-0 opacity-[0.12]" style={{ background: "currentColor" }} />
      <MdiIcon path={icon} className="relative size-6 shrink-0" />
      <span className="relative truncate font-bold" style={{ color: "var(--primary-text-color)" }}>
        {title}
      </span>
    </div>
  )
}
