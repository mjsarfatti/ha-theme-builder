interface SwatchCaptionProps {
  label: string
  hex?: string
}

/**
 * Label + hex, in the theme's own text colors. Shared by every preview
 * section that captions a color tile (UX-SPEC §4). No CSS variable name and
 * no `rgb` tuple — the content audit (§4) cuts both everywhere.
 */
export function SwatchCaption({ label, hex }: SwatchCaptionProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-sm" style={{ color: "var(--primary-text-color)" }}>
        {label}
      </div>
      {hex ? (
        <div className="font-mono text-xs" style={{ color: "var(--secondary-text-color)" }}>
          {hex}
        </div>
      ) : null}
    </div>
  )
}
