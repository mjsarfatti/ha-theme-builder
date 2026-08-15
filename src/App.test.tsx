import { fireEvent, render, screen, within } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"

import App from "./App"

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("renders the app bar and the sidebar, loaded at DEFAULT_CONFIG", () => {
    render(<App />)

    expect(screen.getByRole("heading", { name: /ha theme builder/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /export theme/i })).toBeInTheDocument()

    // §5.1: Reset to defaults starts disabled, nothing has changed yet.
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeDisabled()

    // A representative knob from each group is present and shows the default.
    expect(screen.getByText(/body font family/i)).toBeInTheDocument()
    const primaryRow = screen.getByRole("button", { name: /primary color, currently #009ac7/i })
    expect(primaryRow).toBeInTheDocument()
    expect(within(primaryRow).getByText("#009ac7")).toBeInTheDocument()
  })

  it("picking a palette swatch in the color popover updates the trigger and dirties the store", () => {
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: /primary color, currently #009ac7/i }))
    // Amber is the 14th entry of PALETTE_COLOR_NAMES on the "ha" palette.
    fireEvent.click(screen.getByRole("radio", { name: /^amber,/i }))

    expect(
      screen.getByRole("button", { name: /primary color, currently #ffc107/i })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /reset to defaults/i })).toBeEnabled()
  })

  it("opening the export sheet shows the default theme name", () => {
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: /export theme/i }))

    expect(screen.getByRole("textbox", { name: /theme name/i })).toHaveValue("My Theme")
  })
})
