interface SwatchCaptionProps {
  label: string
  hex?: string
}

/** Label and hex in the theme's text colors, for a color tile. */
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
