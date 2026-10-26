import type { LucideIcon } from "lucide-react"

interface TileIconProps {
  icon: LucideIcon
  /** Theme variable name without the leading `--`, for example `"amber-color"`. */
  colorVar: string
}

/**
 * Round entity icon on a 20% tint of its own color, as in HA tile cards.
 *
 * The tint is a `currentColor` layer at 20% opacity. Home Assistant uses
 * the same construction in `ha-tile-icon.ts` (`--tile-icon-opacity: 0.2`),
 * so the tint follows the theme variable with no color math.
 *
 * @example
 * <TileIcon icon={LampFloorIcon} colorVar="orange-color" />
 */
export function TileIcon({ icon: Icon, colorVar }: TileIconProps) {
  return (
    <span
      className="relative flex size-9 shrink-0 items-center justify-center rounded-full"
      style={{ color: `var(--${colorVar})` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full opacity-20"
        style={{ background: "currentColor" }}
      />
      <Icon aria-hidden="true" className="relative size-5" />
    </span>
  )
}
