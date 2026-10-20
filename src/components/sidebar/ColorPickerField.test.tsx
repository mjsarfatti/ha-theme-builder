import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ColorPickerField } from "./ColorPickerField"
import { useRecentColors } from "./hooks/use-recent-colors"
import { RECENT_COLORS_STORAGE_KEY } from "./lib/recent-colors"
import type { SeedColor } from "./lib/seed-color"

function Harness({
  onChange,
  value = "#009ac7",
}: {
  onChange: (value: string) => void
  value?: string
}) {
  const recentColors = useRecentColors()
  return (
    <ColorPickerField
      label="Primary color"
      value={value}
      defaultValue="#009ac7"
      paletteId="ha"
      recentColors={recentColors}
      onChange={onChange}
    />
  )
}

function openPopoverAndGetHexField() {
  fireEvent.click(screen.getByRole("button", { name: /primary color, currently/i }))
  return screen.getByLabelText(/primary color hex value/i) as HTMLInputElement
}

describe("ColorPickerField — hex field commit behavior (§2.4)", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("does not commit while typing — only on Enter or blur", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = openPopoverAndGetHexField()

    fireEvent.change(input, { target: { value: "#ff0000" } })
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("#ff0000")
  })

  it("commits on blur", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = openPopoverAndGetHexField()

    fireEvent.change(input, { target: { value: "#00ff00" } })
    fireEvent.blur(input)

    expect(onChange).toHaveBeenCalledWith("#00ff00")
  })

  it("accepts a 3-digit hex and expands it on commit", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = openPopoverAndGetHexField()

    fireEvent.change(input, { target: { value: "#0f0" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(onChange).toHaveBeenCalledWith("#00ff00")
  })

  it("shows an inline error and does not commit on invalid input", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = openPopoverAndGetHexField()

    fireEvent.change(input, { target: { value: "not a color" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText(/enter a 3 or 6 digit hex color/i)).toBeInTheDocument()
    expect(input).toHaveAttribute("aria-invalid", "true")
  })

  it("Escape reverts the field to the committed value without committing", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = openPopoverAndGetHexField()

    fireEvent.change(input, { target: { value: "#ff0000" } })
    fireEvent.keyDown(input, { key: "Escape" })

    expect(input.value).toBe("#009ac7")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("the Reset action is absent when the value already matches the default", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} value="#009ac7" />)
    openPopoverAndGetHexField()

    expect(screen.queryByRole("button", { name: /reset primary color/i })).not.toBeInTheDocument()
  })

  it("the Reset action restores the default value", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} value="#ff0000" />)
    openPopoverAndGetHexField()

    fireEvent.click(screen.getByRole("button", { name: /reset primary color/i }))

    expect(onChange).toHaveBeenCalledWith("#009ac7")
  })
})

describe("ColorPickerField — a field the user did not change commits nothing", () => {
  function StatefulHarness({ initial }: { initial: SeedColor }) {
    const [seed, setSeed] = React.useState<SeedColor>(initial)
    const recentColors = useRecentColors()
    return (
      <>
        <output data-testid="seed">{seed}</output>
        <ColorPickerField
          label="Primary color"
          value={seed}
          defaultValue="#009ac7"
          paletteId="ha"
          recentColors={recentColors}
          onChange={setSeed}
        />
      </>
    )
  }

  beforeEach(() => {
    window.localStorage.clear()
  })

  it("keeps a palette reference when the popover opens and closes", () => {
    render(<StatefulHarness initial="palette:amber" />)
    fireEvent.blur(openPopoverAndGetHexField())

    expect(screen.getByTestId("seed").textContent).toBe("palette:amber")
  })

  it("adds nothing to Recent colors when the popover opens and closes", () => {
    render(<StatefulHarness initial="#009ac7" />)
    fireEvent.blur(openPopoverAndGetHexField())

    expect(window.localStorage.getItem(RECENT_COLORS_STORAGE_KEY)).toBeNull()
  })

  it("Escape reverts without committing, although it also blurs the field", () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    const input = openPopoverAndGetHexField()
    input.focus()

    fireEvent.change(input, { target: { value: "#ff0000" } })
    fireEvent.keyDown(input, { key: "Escape" })
    fireEvent.blur(input)

    expect(input.value).toBe("#009ac7")
    expect(onChange).not.toHaveBeenCalled()
  })
})
