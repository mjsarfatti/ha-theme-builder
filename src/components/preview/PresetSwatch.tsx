import { rgbTriplet } from "@/engine"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface PresetSwatchProps {
  /** The step name (`"05"`) or color name (`"Amber"`) under the swatch. */
  label: string
  hex: string
}

/**
 * Flat color tile with a label and hex and RGB captions.
 *
 * The tile fills with the raw preset hex, so a section can compare
 * presets directly. The captions show when the preview is wide. The
 * tooltip always shows the hex.
 *
 * @example
 * <PresetSwatch label="05" hex="#8a8a8a" />
 */
export function PresetSwatch({ label, hex }: PresetSwatchProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="flex w-full min-w-0 flex-col items-center gap-1 rounded-md p-1 text-center outline-offset-2"
        aria-label={`${label}, ${hex}`}
      >
        <span
          aria-hidden="true"
          className="aspect-square w-full rounded-md"
          style={{ background: hex, border: "1px solid var(--divider-color)" }}
        />
        <span className="w-full truncate text-[11px]" style={{ color: "var(--primary-text-color)" }}>
          {label}
        </span>
        <span
          className="hidden w-full truncate font-mono text-[10px] @3xl/preview:block"
          style={{ color: "var(--secondary-text-color)" }}
        >
          {hex}
        </span>
        <span
          className="hidden w-full truncate font-mono text-[10px] @3xl/preview:block"
          style={{ color: "var(--secondary-text-color)" }}
        >
          {rgbTriplet(hex)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {label} · {hex}
      </TooltipContent>
    </Tooltip>
  )
}
