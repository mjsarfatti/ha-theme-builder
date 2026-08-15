import { TriangleAlertIcon } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { contrastRatio, modeVars, type CssVarMap } from "@/engine"
import { PreviewPairGrid } from "../PairGrid"
import { PreviewPanel } from "../Panel"
import { PreviewSection } from "../PreviewSection"
import type { PreviewSectionProps } from "../types"

/**
 * WCAG AA for large text, distinct from the engine's own selection threshold
 * of 6 (`HA_CONTRAST_THRESHOLD`). The engine picks the text color for the
 * primary chip at 6, because that is what Home Assistant uses. This warning
 * uses 3, the WCAG AA level for large text — the owner's decision, since
 * each chip's label renders at a large size. A chip can pass selection and
 * still raise this warning (UX-SPEC §4.3).
 */
const WARNING_CONTRAST_THRESHOLD = 3

/**
 * Every chip's label takes `--text-primary-color`. Home Assistant computes
 * an on-color for the primary color only — every other color reuses that
 * same value, not a color-specific computation.
 *
 * Checked against the source: `ha-sidebar.ts`'s notification badge sets
 * `color: var(--text-accent-color, var(--text-primary-color))`, and
 * `--text-accent-color` has no definition anywhere in `color.globals.ts`, so
 * the fallback always applies. `color.globals.ts:288` sets
 * `--mdc-theme-on-secondary: var(--text-primary-color)`, and secondary is
 * the accent color. A real screenshot (`home-assistant.io`,
 * `source/images/integrations/repairs/number-of-repairs.png`) shows a white
 * numeral on the orange accent badge — `--text-primary-color`'s own default
 * (`color.globals.ts:10`), not a computed on-accent color. The newer
 * `--ha-color-*` layer agrees: `semantic.globals.ts` sets every
 * `--ha-color-on-*-loud` value to `var(--white-color)`, in light and dark
 * mode, except `--ha-color-on-disabled-loud`.
 */
const CHIPS = [
  { label: "Primary color", colorVar: "primary-color" },
  { label: "Accent color", colorVar: "accent-color" },
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
        const text = values["text-primary-color"]
        const ratio = contrastRatio(text, bg)
        const fails = ratio < WARNING_CONTRAST_THRESHOLD

        return (
          <div key={chip.colorVar} className="flex min-w-0 flex-col gap-1">
            <div
              className="flex h-16 items-center justify-between gap-2 rounded-lg px-3"
              style={{ background: `var(--${chip.colorVar})`, color: "var(--text-primary-color)" }}
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
                    Home Assistant renders this label at {ratio.toFixed(1)}:1, under the 3:1
                    guideline. The low contrast is in Home Assistant, not a choice this builder
                    made.
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
