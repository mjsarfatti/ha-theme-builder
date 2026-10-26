import { PreviewPairGrid } from "../PairGrid"
import { PreviewPanel } from "../Panel"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"
import { ErrorCard } from "./living-room/ErrorCard"
import { RoomCard } from "./living-room/RoomCard"
import { StatusCard } from "./living-room/StatusCard"

export function LivingRoomSection({ lightVars, darkVars }: PreviewSectionProps) {
  return (
    <PreviewSection
      id="living-room"
      title="Living room"
      description="Your dashboard, built only from the theme."
    >
      <PreviewPairGrid>
        <PreviewPanel mode="light" vars={lightVars}>
          <LivingRoomDemo />
        </PreviewPanel>
        <PreviewPanel mode="dark" vars={darkVars}>
          <LivingRoomDemo />
        </PreviewPanel>
      </PreviewPairGrid>
    </PreviewSection>
  )
}

function LivingRoomDemo() {
  return (
    <div className="flex flex-col gap-6">
      <RoomCard />
      <StatusCard />
      <div className="flex flex-col gap-2">
        <ErrorCard severity="warning" title="Entity not available: light.porch" />
        <ErrorCard severity="error" title="Configuration error" />
      </div>
    </div>
  )
}
