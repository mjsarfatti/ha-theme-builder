import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { derive, toCssProperties, type DerivedTheme } from "@/engine"
import { BrandStatusSection } from "../sections/BrandStatusSection"

function renderSection(theme: DerivedTheme) {
  return render(
    <BrandStatusSection
      theme={theme}
      lightVars={toCssProperties(theme, "light") as React.CSSProperties}
      darkVars={toCssProperties(theme, "dark") as React.CSSProperties}
    />,
  )
}

const CHIP_LABELS = [
  "Primary color",
  "Accent color",
  "Error color",
  "Warning color",
  "Success color",
  "Info color",
]

describe("BrandStatusSection", () => {
  it("renders all six chips, labeled, in both panels", () => {
    renderSection(derive())
    for (const label of CHIP_LABELS) {
      expect(screen.getAllByText(label)).toHaveLength(2) // one per panel (light + dark)
    }
  })

  it("colors every chip's label with --text-primary-color, not a per-color computation", () => {
    // Home Assistant computes an on-color for the primary color only. Every
    // other color reuses that same `--text-primary-color` value — see the
    // citations in BrandStatusSection.tsx and UX-SPEC §4.3.
    renderSection(derive())
    for (const label of CHIP_LABELS) {
      const [lightChip] = screen.getAllByText(label)
      const chip = lightChip.parentElement as HTMLElement
      expect(chip.style.color).toBe("var(--text-primary-color)")
    }
  })

  it("warns on exactly the chips under 3:1, for the default config", () => {
    // Verified against the engine directly (`contrastRatio` on the derived
    // theme): under `DEFAULT_CONFIG`, `--text-primary-color` is `#ffffff`.
    // Accent (2.16:1) and Warning (2.21:1) fail 3:1 against it. Primary
    // (3.26:1), Error (4.59:1), Success (3.00:1) and Info (3.08:1) clear it.
    // Not a contrived fixture — this is Home Assistant's own theme.
    renderSection(derive())

    // Two warning chips × two panels (light + dark, since brand/status
    // colors and `--text-primary-color` are both mode-independent per the
    // engine README).
    const warnings = screen.getAllByLabelText(/Low contrast/)
    expect(warnings).toHaveLength(4)
    for (const warning of warnings) {
      expect(warning.closest("div")?.textContent).toMatch(/Accent color|Warning color/)
    }
  })

  it("does not warn when every chip clears 3:1", () => {
    const theme = derive({
      colors: {
        primary: "#0a3a8a",
        accent: "#7a1010",
        error: "#8a0f1f",
        warning: "#8a4a00",
        success: "#0a5a1f",
        info: "#0a3a8a",
      },
    })
    renderSection(theme)
    expect(screen.queryAllByLabelText(/Low contrast/)).toHaveLength(0)
  })

  it("names Home Assistant, not the builder, as the source of the low contrast", async () => {
    renderSection(derive())
    const [trigger] = screen.getAllByLabelText(/Low contrast/)
    fireEvent.focus(trigger)
    const tooltip = await screen.findByText(/Home Assistant renders this label/)
    expect(tooltip).toBeInTheDocument()
  })

  it("names the color, not a CSS variable, under each chip", () => {
    const theme = derive()
    renderSection(theme)
    expect(screen.getAllByText(theme.common["primary-color"])).toHaveLength(2)
  })
})
