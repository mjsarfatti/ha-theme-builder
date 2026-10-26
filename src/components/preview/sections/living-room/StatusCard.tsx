import {
  mdiAlertCircleOutline,
  mdiAlertOutline,
  mdiCheckboxMarkedCircleOutline,
  mdiGarage,
  mdiGauge,
  mdiInformationOutline,
  mdiLightbulb,
  mdiLock,
  mdiThermostat,
} from "@mdi/js"

import { MdiIcon } from "./MdiIcon"
import { TileIcon } from "./TileIcon"

const ENTITY_ICONS = [
  { label: "Light", icon: mdiLightbulb, colorVar: "amber-color" },
  { label: "Lock", icon: mdiLock, colorVar: "red-color" },
  { label: "Climate", icon: mdiThermostat, colorVar: "blue-color" },
  { label: "Sensor", icon: mdiGauge, colorVar: "green-color" },
] as const

// Icons per alert type, as ha-alert.ts maps them.
const ALERTS = [
  { message: "Front door unlocked for 10 minutes", icon: mdiAlertCircleOutline, colorVar: "error-color" },
  { message: "Hallway sensor battery at 15%", icon: mdiAlertOutline, colorVar: "warning-color" },
  { message: "Backup completed", icon: mdiCheckboxMarkedCircleOutline, colorVar: "success-color" },
  { message: "Update available", icon: mdiInformationOutline, colorVar: "info-color" },
] as const

/** Entity colors, buttons, status alerts and an unavailable entity row. */
export function StatusCard() {
  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-4"
      style={{ background: "var(--card-background-color)", border: "1px solid var(--divider-color)" }}
    >
      <div className="grid grid-cols-4 gap-2">
        {ENTITY_ICONS.map(({ label, icon, colorVar }) => (
          <div key={label} className="flex min-w-0 flex-col items-center gap-1">
            <TileIcon path={icon} colorVar={colorVar} />
            <span className="truncate text-xs" style={{ color: "var(--secondary-text-color)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Mock buttons are spans: the preview has no focusable control. */}
      <div className="flex flex-wrap gap-2">
        <span
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: "var(--primary-color)", color: "var(--text-primary-color)" }}
        >
          Turn on
        </span>
        <span
          className="rounded-full px-4 py-2 text-sm font-medium"
          style={{ border: "1px solid var(--divider-color)", color: "var(--primary-color)" }}
        >
          Cancel
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {ALERTS.map(({ message, icon, colorVar }) => (
          <div
            key={colorVar}
            className="relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2"
            style={{ color: `var(--${colorVar})` }}
          >
            {/* ha-alert.ts paints the alert color at 0.12 opacity behind the text. */}
            <span aria-hidden="true" className="absolute inset-0 opacity-[0.12]" style={{ background: "currentColor" }} />
            <MdiIcon path={icon} className="relative size-5 shrink-0" />
            <span className="relative text-sm" style={{ color: "var(--primary-text-color)" }}>
              {message}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-3 pt-3"
        style={{ borderTop: "1px solid var(--divider-color)", color: "var(--disabled-text-color)" }}
      >
        <MdiIcon path={mdiGarage} className="size-5 shrink-0" />
        <span className="flex-1 truncate text-sm">Garage door</span>
        <span className="text-sm">Unavailable</span>
      </div>
    </div>
  )
}
