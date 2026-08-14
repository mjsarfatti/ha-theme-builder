import { render, screen } from "@testing-library/react"
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

describe("BrandStatusSection", () => {
  it("renders all six chips, labeled, in both panels", () => {
    renderSection(derive())
    for (const label of [
      "Primary color",
      "Accent color",
      "Error color",
      "Warning color",
      "Success color",
      "Info color",
    ]) {
      expect(screen.getAllByText(label)).toHaveLength(2) // one per panel (light + dark)
    }
  })

  it("warns on exactly the chips under 4.5:1, for the default config", () => {
    // Verified against the engine directly (`contrastRatio` on the derived
    // theme): under `DEFAULT_CONFIG`, Primary (3.26:1), Success (3.00:1) and
    // Info (3.08:1) fall under WCAG AA. Accent (7.47:1), Error (4.59:1) and
    // Warning (7.29:1) clear it. This is the engine's own selection
    // (`contrastingText`, threshold 6) landing under the UI's separate 4.5
    // warning threshold (UX-SPEC §4.3) — not a contrived fixture.
    renderSection(derive())

    // Three warning chips × two panels (light + dark, since brand/status
    // colors are mode-independent per the engine README).
    expect(screen.getAllByLabelText(/Low contrast/)).toHaveLength(6)
  })

  it("does not warn when every chip clears 4.5:1", () => {
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

  it("names the color, not a CSS variable, under each chip", () => {
    const theme = derive()
    renderSection(theme)
    expect(screen.getAllByText(theme.common["primary-color"])).toHaveLength(2)
  })
})
