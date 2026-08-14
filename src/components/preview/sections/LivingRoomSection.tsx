import { LightbulbIcon } from "lucide-react"

import { PreviewPairGrid } from "../PairGrid"
import { PreviewPanel } from "../Panel"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"

const ENTITIES = [
  { name: "Floor lamp", state: "On · 60%", on: true },
  { name: "Bar lamp", state: "Off", on: false },
  { name: "Blinds", state: "Open", on: true },
  { name: "Nest mini", state: "Idle", on: false },
] as const

/**
 * UX-SPEC §4.6, promoted to M5's own milestone in full. This is a
 * structurally correct placeholder, not the M5 build: a room header and a
 * grid of inert entity tiles, driven only by theme variables — card and
 * primary backgrounds, both text colors, the divider and the primary color
 * — so the section proves the seam works without building M5's dashboard,
 * icon set or second card.
 */
export function LivingRoomSection({ lightVars, darkVars }: PreviewSectionProps) {
  return (
    <PreviewSection
      id="living-room"
      title="Living room"
      description="Your dashboard, built only from the theme."
    >
      <PreviewPairGrid>
        <PreviewPanel mode="light" vars={lightVars}>
          <LivingRoomCard />
        </PreviewPanel>
        <PreviewPanel mode="dark" vars={darkVars}>
          <LivingRoomCard />
        </PreviewPanel>
      </PreviewPairGrid>
    </PreviewSection>
  )
}

function LivingRoomCard() {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex items-baseline justify-between rounded-lg px-3 py-2"
        style={{ background: "var(--card-background-color)", border: "1px solid var(--divider-color)" }}
      >
        <span
          className="text-base font-medium"
          style={{ fontFamily: "var(--ha-font-family-heading)", color: "var(--primary-text-color)" }}
        >
          Living room
        </span>
        <span className="text-sm" style={{ color: "var(--secondary-text-color)" }}>
          22.8° · 57%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ENTITIES.map((entity) => (
          <EntityTile key={entity.name} {...entity} />
        ))}
      </div>
      <p className="text-xs italic" style={{ color: "var(--secondary-text-color)" }}>
        M5 builds the full dashboard and a second card. This placeholder only proves the surfaces,
        text and primary color read correctly from the theme.
      </p>
    </div>
  )
}

function EntityTile({ name, state, on }: { name: string; state: string; on: boolean }) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg p-3"
      style={{ background: "var(--card-background-color)", border: "1px solid var(--divider-color)" }}
    >
      <LightbulbIcon
        aria-hidden="true"
        className="size-5"
        style={{ color: on ? "var(--state-icon-color)" : "var(--secondary-text-color)" }}
      />
      <span className="text-sm" style={{ color: "var(--primary-text-color)" }}>
        {name}
      </span>
      <span className="text-xs" style={{ color: "var(--secondary-text-color)" }}>
        {state}
      </span>
    </div>
  )
}
