import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface PresetSwatchProps {
  /** The step name (`"05"`) or color name (`"Amber"`) under the swatch. */
  label: string
  hex: string
}

/**
 * One swatch in the Neutral ramp or Entity colors section (UX-SPEC §4.4,
 * §4.5): a flat color tile, the label, and the hex. The hex is raw preset
 * data (`theme.ramps.neutral`, the extended palette), so it renders as a
 * literal fill and text color — not a `var(--ha-*)` reference, unlike every
 * other preview surface — because these two sections exist to compare the
 * presets themselves, on the builder's own neutral chrome, not to show how a
 * mode consumes them.
 *
 * Below roughly 28px per swatch the hex caption hides and the tooltip
 * becomes the only way to read it (§1.5's compact-swatch rule). Section
 * width there tracks the sidebar, which M3 does not render standalone, so
 * this uses a container query on the preview root itself rather than a
 * viewport breakpoint — the most faithful read of "available preview width,
 * not viewport" without the sidebar mounted.
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
      </TooltipTrigger>
      <TooltipContent>
        {label} · {hex}
      </TooltipContent>
    </Tooltip>
  )
}
