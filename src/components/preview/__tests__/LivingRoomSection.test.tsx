import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { derive, toCssProperties } from "@/engine"
import type { CSSProperties } from "react"
import { LivingRoomSection } from "../sections/LivingRoomSection"

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(|\b(?:white|black)\b/i
const TAILWIND_COLOR_CLASS =
  /\b(?:bg|text|border|outline|ring|fill|stroke|from|to|via)-(?:white|black|[a-z]+-\d{2,3})\b/

function renderSection() {
  const theme = derive()
  return render(
    <LivingRoomSection
      theme={theme}
      lightVars={toCssProperties(theme, "light") as CSSProperties}
      darkVars={toCssProperties(theme, "dark") as CSSProperties}
    />,
  )
}

/** Every element inside a preview panel, without the panels that hold the theme values. */
function demoElements(container: HTMLElement) {
  return [...container.querySelectorAll("[data-preview-mode] *")]
}

describe("LivingRoomSection", () => {
  it("uses only theme variables for color: no color literal in any inline style", () => {
    const { container } = renderSection()
    const offenders = demoElements(container)
      .map((el) => el.getAttribute("style") ?? "")
      .filter((style) => COLOR_LITERAL.test(style))
    expect(offenders).toEqual([])
  })

  it("uses no Tailwind color utility inside a panel", () => {
    const { container } = renderSection()
    const offenders = demoElements(container)
      .map((el) => el.getAttribute("class") ?? "")
      .filter((cls) => TAILWIND_COLOR_CLASS.test(cls))
    expect(offenders).toEqual([])
  })

  it("is inert: nothing in the demo enters the tab order", () => {
    const { container } = renderSection()
    expect(container.querySelectorAll("a, button, input, select, textarea, [tabindex]")).toHaveLength(0)
  })

  it("renders the room card and the second card in both modes", () => {
    const { getAllByText } = renderSection()
    expect(getAllByText("Spotlights")).toHaveLength(2)
    expect(getAllByText("Garage door")).toHaveLength(2)
    expect(getAllByText("Backup completed")).toHaveLength(2)
  })
})
