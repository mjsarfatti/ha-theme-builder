import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PreviewPanel } from "../Panel"

describe("PreviewPanel", () => {
  it("applies every variable from `vars` to its own element, not to :root", () => {
    render(
      <PreviewPanel
        mode="light"
        vars={{ "--primary-color": "#009ac7", "--divider-color": "#0000001f" } as React.CSSProperties}
      >
        <span data-testid="child">content</span>
      </PreviewPanel>,
    )

    const panel = screen.getByTestId("child").parentElement as HTMLElement
    expect(panel.style.getPropertyValue("--primary-color")).toBe("#009ac7")
    expect(panel.style.getPropertyValue("--divider-color")).toBe("#0000001f")

    // The single most important constraint in this milestone (CLAUDE.md,
    // UX-SPEC §6.1 item 2): theme variables never land on `:root`.
    expect(document.documentElement.style.getPropertyValue("--primary-color")).toBe("")
    expect(document.body.style.getPropertyValue("--primary-color")).toBe("")
  })

  it("labels itself with the mode it renders, for the pair grid and for tests", () => {
    render(
      <PreviewPanel mode="dark" vars={{}}>
        <span data-testid="child">content</span>
      </PreviewPanel>,
    )
    const panel = screen.getByTestId("child").parentElement as HTMLElement
    expect(panel.dataset.previewMode).toBe("dark")
  })

  it("keeps its own background, border and text color on theme variables, not builder colors", () => {
    render(
      <PreviewPanel mode="light" vars={{}}>
        <span data-testid="child">content</span>
      </PreviewPanel>,
    )
    const panel = screen.getByTestId("child").parentElement as HTMLElement
    expect(panel.style.background).toBe("var(--primary-background-color)")
    expect(panel.style.border).toBe("1px solid var(--divider-color)")
    expect(panel.style.color).toBe("var(--primary-text-color)")
  })
})
