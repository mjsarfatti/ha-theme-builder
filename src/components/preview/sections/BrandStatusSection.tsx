import { TriangleAlertIcon } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { contrastingText, contrastRatio, modeVars, type CssVarMap } from "@/engine"
import { PreviewPairGrid } from "../PairGrid"
import { PreviewPanel } from "../Panel"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"

/**
 * WCAG AA, distinct from the engine's own selection threshold of 6
 * (`HA_CONTRAST_THRESHOLD`). The engine picks *which* text color goes on a
 * brand color at 6, because that is what Home Assistant uses. This warning
 * uses 4.5 because that is the general legibility guideline a reader outside
 * HA can check the ratio against — a chip can pass selection and still raise
 * this warning (UX-SPEC §4.3).
 */
const WARNING_CONTRAST_THRESHOLD = 4.5

const CHIPS = [
  { label: "Primary color", colorVar: "primary-color", textVar: "text-primary-color" },
  { label: "Accent color", colorVar: "accent-color", textVar: "text-accent-color" },
  { label: "Error color", colorVar: "error-color" },
  { label: "Warning color", colorVar: "warning-color" },
  { label: "Success color", colorVar: "success-color" },
  { label: "Info color", colorVar: "info-color" },
] as const

/** UX-SPEC §4.3. */
export function BrandStatusSection({ theme, lightVars, darkVars }: PreviewSectionProps) {
  const light = modeVars(theme, "light")
  const dark = modeVars(theme, "dark")

  return (
    <PreviewSection
      id="brand-status"
      title="Brand & status"
      description="Labels render on the color, so legibility is visible, not reported."
    >
      <PreviewPairGrid>
        <PreviewPanel mode="light" vars={lightVars}>
          <BrandChips values={light} />
        </PreviewPanel>
        <PreviewPanel mode="dark" vars={darkVars}>
          <BrandChips values={dark} />
        </PreviewPanel>
      </PreviewPairGrid>
    </PreviewSection>
  )
}

function BrandChips({ values }: { values: CssVarMap }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
    >
      {CHIPS.map((chip) => {
        const bg = values[chip.colorVar]
        const text = "textVar" in chip ? values[chip.textVar] : contrastingText(bg)
        const ratio = contrastRatio(text, bg)
        const fails = ratio < WARNING_CONTRAST_THRESHOLD

        return (
          <div key={chip.colorVar} className="flex min-w-0 flex-col gap-1">
            <div
              className="flex h-16 items-center justify-between gap-2 rounded-lg px-3"
              style={{ background: `var(--${chip.colorVar})`, color: text }}
            >
              <span className="truncate text-sm font-medium">{chip.label}</span>
              {fails ? (
                <Tooltip>
                  <TooltipTrigger
                    className="inline-flex shrink-0 outline-offset-2"
                    aria-label={`Low contrast, ${ratio.toFixed(1)} to 1`}
                  >
                    <TriangleAlertIcon className="size-4" aria-hidden="true" />
                  </TooltipTrigger>
                  <TooltipContent>
                    This label is hard to read on this color: {ratio.toFixed(1)}:1, under the
                    4.5:1 guideline.
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <span className="truncate font-mono text-xs" style={{ color: "var(--secondary-text-color)" }}>
              {bg}
            </span>
          </div>
        )
      })}
    </div>
  )
}
