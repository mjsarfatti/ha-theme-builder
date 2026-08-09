import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import App from "./App"

describe("App", () => {
  it("renders the scaffold placeholder", () => {
    render(<App />)
    expect(screen.getByText(/ha theme builder/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /it works/i })).toBeInTheDocument()
  })
})
