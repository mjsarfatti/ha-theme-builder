import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { derive } from "@/engine"
import { Preview } from "../Preview"

const SECTION_ORDER = [
  "Living room",
  "Surfaces & dividers",
  "Text & type",
  "Brand & status",
  "Neutral ramp",
  "Entity colors",
]

describe("Preview", () => {
  it("renders the six UX-SPEC §1.3 sections, in order", () => {
    render(<Preview theme={derive()} />)
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(SECTION_ORDER)
  })

  it("pairs light and dark panels for the mode-dependent sections", () => {
    const { container } = render(<Preview theme={derive()} />)
    const lightPanels = container.querySelectorAll('[data-preview-mode="light"]')
    const darkPanels = container.querySelectorAll('[data-preview-mode="dark"]')

    // Living room, Surfaces, Text & type, Brand & status: paired (light + dark).
    // Neutral ramp, Entity colors: one panel each, light only (§1.2's "Both modes" rule).
    expect(darkPanels).toHaveLength(4)
    expect(lightPanels).toHaveLength(6)
  })

  it("tags exactly the full-width sections `Both modes`", () => {
    render(<Preview theme={derive()} />)
    expect(screen.getAllByText("Both modes")).toHaveLength(2)
  })

  it("never sets a theme variable on :root, across the whole pane", () => {
    render(<Preview theme={derive()} />)
    expect(document.documentElement.getAttribute("style")).toBeNull()
  })

  it("is read-only: no form controls that could mutate theme state", () => {
    const { container } = render(<Preview theme={derive()} />)
    expect(container.querySelectorAll("input, select, textarea")).toHaveLength(0)
  })

  it("renders light and dark panels with different surface variables for the same theme", () => {
    const { container } = render(<Preview theme={derive()} />)
    const [lightPanel] = container.querySelectorAll('[data-preview-mode="light"]')
    const [darkPanel] = container.querySelectorAll('[data-preview-mode="dark"]')

    const lightCard = (lightPanel as HTMLElement).style.getPropertyValue("--card-background-color")
    const darkCard = (darkPanel as HTMLElement).style.getPropertyValue("--card-background-color")
    expect(lightCard).not.toBe("")
    expect(darkCard).not.toBe("")
    expect(lightCard).not.toBe(darkCard)
  })

  it("re-renders every section when the theme prop changes, with no leftover state", () => {
    const { container, rerender } = render(
      <Preview theme={derive({ colors: { primary: "#7c5cff" } })} />,
    )
    const [lightPanel] = container.querySelectorAll('[data-preview-mode="light"]')
    expect((lightPanel as HTMLElement).style.getPropertyValue("--primary-color")).toBe("#7c5cff")

    rerender(<Preview theme={derive({ colors: { primary: "#22aa44" } })} />)
    const [lightPanelAfter] = container.querySelectorAll('[data-preview-mode="light"]')
    expect((lightPanelAfter as HTMLElement).style.getPropertyValue("--primary-color")).toBe(
      "#22aa44",
    )
  })

  it("reflects the neutral ramp preset in the Neutral ramp section", () => {
    render(<Preview theme={derive({ neutralRamp: "mauve" })} />)
    // The 05 step of the mauve neutral ramp — read from the derived theme
    // itself so this does not hardcode a hex the preset data could change.
    const theme = derive({ neutralRamp: "mauve" })
    const hex = theme.ramps.neutral[5]
    expect(screen.getByLabelText(`05, ${hex}`)).toBeInTheDocument()
  })

  it("reflects the entity palette preset in the Entity colors section", () => {
    const theme = derive({ palette: "tailwind-v4" })
    render(<Preview theme={theme} />)
    const hex = theme.common["amber-color"]
    expect(screen.getByLabelText(`Amber, ${hex}`)).toBeInTheDocument()
  })
})
