import type { CSSProperties, ReactNode } from "react"

import { modeVars, type CssVarMap } from "@/engine"
import { PreviewPairGrid } from "../PairGrid"
import { PreviewPanel } from "../Panel"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"

const PANGRAM = "The quick brown fox jumps over the lazy dog."

/** UX-SPEC §4.2. */
export function TextTypeSection({ theme, lightVars, darkVars }: PreviewSectionProps) {
  const light = modeVars(theme, "light")
  const dark = modeVars(theme, "dark")

  return (
    <PreviewSection
      id="text-type"
      title="Text & type"
      description="Three text colors, one typeface at three sizes, and a fixed code line."
    >
      <PreviewPairGrid>
        <PreviewPanel mode="light" vars={lightVars}>
          <TextTypeContent values={light} />
        </PreviewPanel>
        <PreviewPanel mode="dark" vars={darkVars}>
          <TextTypeContent values={dark} />
        </PreviewPanel>
      </PreviewPairGrid>
    </PreviewSection>
  )
}

function TextTypeContent({ values }: { values: CssVarMap }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 text-base" style={{ fontFamily: "var(--ha-font-family-body)" }}>
        <p style={{ color: "var(--primary-text-color)" }}>{PANGRAM}</p>
        <p style={{ color: "var(--secondary-text-color)" }}>{PANGRAM}</p>
        <p style={{ color: "var(--disabled-text-color)" }}>{PANGRAM}</p>
      </div>
      <div className="font-mono text-xs" style={{ color: "var(--secondary-text-color)" }}>
        Primary {values["primary-text-color"]} · Secondary {values["secondary-text-color"]} · Disabled{" "}
        {values["disabled-text-color"]}
      </div>
      <div
        className="flex flex-col gap-3 rounded-lg p-3"
        style={{ background: "var(--card-background-color)", border: "1px solid var(--divider-color)" }}
      >
        <TypeSpecimenRow
          role="Heading size, body face"
          className="text-xl font-bold"
          style={{ fontFamily: "var(--ha-font-family-heading)" }}
        >
          Living room
        </TypeSpecimenRow>
        <TypeSpecimenRow role="Body" className="text-base" style={{ fontFamily: "var(--ha-font-family-body)" }}>
          A sentence at body size, in the body face.
        </TypeSpecimenRow>
        <TypeSpecimenRow
          role="Longform, body face"
          className="text-sm leading-relaxed"
          style={{ fontFamily: "var(--ha-font-family-longform)" }}
        >
          A longer paragraph at the longform size, still in the body face. It shows the line length
          and rhythm a reader sees in a longer piece of Home Assistant text.
        </TypeSpecimenRow>
        <TypeSpecimenRow
          role="Code, fixed monospace — does not follow Body"
          className="text-xs"
          style={{ fontFamily: "var(--ha-font-family-code)" }}
        >
          sensor.living_room_temperature
        </TypeSpecimenRow>
      </div>
    </div>
  )
}

function TypeSpecimenRow({
  role,
  className,
  style,
  children,
}: {
  role: string
  className: string
  style: CSSProperties
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className={className} style={{ color: "var(--primary-text-color)", ...style }}>
        {children}
      </p>
      <span
        className="text-[11px] tracking-wide uppercase"
        style={{ color: "var(--secondary-text-color)" }}
      >
        {role}
      </span>
    </div>
  )
}
