import {
  mdiBlindsHorizontalClosed,
  mdiCeilingLight,
  mdiFloorLamp,
  mdiLightbulbOff,
  mdiSofa,
  mdiSpeaker,
  mdiThermometer,
  mdiWaterPercent,
} from "@mdi/js"

import { MdiIcon } from "./MdiIcon"
import { TileIcon } from "./TileIcon"

interface Tile {
  name: string
  state: string
  icon: string
  /** Home Assistant colors an inactive tile with `--disabled-color` (`ha-tile-icon.ts`). */
  colorVar: string
}

const FLOOR_LAMP: Tile = { name: "Floor lamp", state: "70%", icon: mdiFloorLamp, colorVar: "orange-color" }
const BAR_LAMP: Tile = { name: "Bar lamp", state: "Off", icon: mdiLightbulbOff, colorVar: "disabled-color" }
const BLINDS: Tile = { name: "Blinds", state: "Closed", icon: mdiBlindsHorizontalClosed, colorVar: "disabled-color" }
const SPOTLIGHTS: Tile = { name: "Spotlights", state: "75%", icon: mdiCeilingLight, colorVar: "amber-color" }
const NEST_MINI: Tile = { name: "Nest mini", state: "Playing", icon: mdiSpeaker, colorVar: "blue-color" }

const TILE_STYLE = {
  background: "var(--card-background-color)",
  border: "1px solid var(--divider-color)",
}

/** Room header and five entity tiles, after the blueprint's applied demo. */
export function RoomCard() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        {/* The header takes the body font: ha-card reads --ha-card-header-font-family, inherit. */}
        <div className="flex items-center gap-2">
          <MdiIcon path={mdiSofa} className="size-[18px]" />
          <span className="text-base">Living room</span>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: "var(--secondary-text-color)" }}>
          <span className="flex items-center gap-0.5">
            <MdiIcon path={mdiThermometer} className="size-4" style={{ color: "var(--red-color)" }} />
            22.8 °C
          </span>
          <span className="flex items-center gap-0.5">
            <MdiIcon path={mdiWaterPercent} className="size-4" style={{ color: "var(--light-blue-color)" }} />
            57%
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <EntityTile tile={FLOOR_LAMP} />
        <SliderTile tile={SPOTLIGHTS} percent={75} />
        <EntityTile tile={BAR_LAMP} />
        <EntityTile tile={BLINDS} />
        <EntityTile tile={NEST_MINI} />
      </div>
    </div>
  )
}

function TileLabel({ tile }: { tile: Tile }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium">{tile.name}</div>
      <div className="truncate text-xs" style={{ color: "var(--secondary-text-color)" }}>
        {tile.state}
      </div>
    </div>
  )
}

function EntityTile({ tile }: { tile: Tile }) {
  return (
    <div className="flex h-14 min-w-0 items-center gap-2.5 rounded-lg px-2.5" style={TILE_STYLE}>
      <TileIcon path={tile.icon} colorVar={tile.colorVar} />
      <TileLabel tile={tile} />
    </div>
  )
}

function SliderTile({ tile, percent }: { tile: Tile; percent: number }) {
  return (
    <div className="row-span-2 flex min-w-0 flex-col justify-between gap-2 rounded-lg p-2.5" style={TILE_STYLE}>
      <div className="flex items-center gap-2.5">
        <TileIcon path={tile.icon} colorVar={tile.colorVar} />
        <TileLabel tile={tile} />
      </div>
      {/* Inert mock of ha-control-slider: a 20% track, a solid fill and a thumb bar. */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative h-10 overflow-hidden rounded-lg"
        style={{ color: `var(--${tile.colorVar})` }}
      >
        <span className="absolute inset-0 opacity-20" style={{ background: "currentColor" }} />
        <span
          className="absolute inset-y-0 left-0 rounded-lg"
          style={{ width: `${percent}%`, background: "currentColor" }}
        />
        {/* HA hardcodes the thumb white in both modes (ha-control-slider.ts). */}
        <span
          data-ha-hardcoded
          className="absolute inset-y-2.5 w-1 -translate-x-[9px] rounded-sm"
          style={{ left: `${percent}%`, background: "white" }}
        />
      </div>
    </div>
  )
}
