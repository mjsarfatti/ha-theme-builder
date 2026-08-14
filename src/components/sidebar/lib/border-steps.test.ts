import { describe, expect, it } from "vitest"

import { derive } from "@/engine"

import { BORDER_STEPS, getBorderStepOptions, mirrorSlot } from "./border-steps"

describe("mirrorSlot", () => {
  it("is 100 - s, per README's dark-mode rule", () => {
    expect(mirrorSlot(5)).toBe(95)
    expect(mirrorSlot(95)).toBe(5)
    expect(mirrorSlot(30)).toBe(70)
    expect(mirrorSlot(70)).toBe(30)
    expect(mirrorSlot(50)).toBe(50)
  })
})

describe("getBorderStepOptions", () => {
  // A theme with the default config. `card-background-color` and
  // `ha-box-shadow-s` don't depend on `borderColor`, so this one theme is a
  // valid source for every step's card/shadow regardless of which step is
  // currently selected in the store.
  const theme = derive({})

  it("returns the five named steps, in the spec's own order", () => {
    const options = getBorderStepOptions(theme)
    expect(options.map((o) => o.value)).toEqual(
      BORDER_STEPS.map((s) => s.value)
    )
    expect(options.map((o) => o.label)).toEqual([
      "Invisible",
      "Hairline",
      "Subtle",
      "Medium",
      "Strong",
    ])
  })

  it("matches derive.ts's own divider-color for every step, in both modes", () => {
    const options = getBorderStepOptions(theme)

    for (const option of options) {
      const themeForStep = derive({ borderColor: option.value })
      expect(option.light.borderColor).toBe(themeForStep.light["divider-color"])
      expect(option.dark.borderColor).toBe(themeForStep.dark["divider-color"])
    }
  })

  it("Invisible (match-card) uses the current mode's own card color as its source", () => {
    const [invisible] = getBorderStepOptions(theme)
    expect(invisible.value).toBe("match-card")
    expect(invisible.light.sourceHex).toBe(theme.light["card-background-color"])
    expect(invisible.dark.sourceHex).toBe(theme.dark["card-background-color"])
  })

  it("Strong (neutral-05) reads the mirrored slot (neutral-95) in dark mode", () => {
    const options = getBorderStepOptions(theme)
    const strong = options.find((o) => o.value === "neutral-05")!
    expect(strong.light.sourceHex).toBe(theme.ramps.neutral[5])
    expect(strong.dark.sourceHex).toBe(theme.ramps.neutral[95])
  })

  it("every step shares the same card and shadow per mode — only the border differs", () => {
    const options = getBorderStepOptions(theme)
    for (const option of options) {
      expect(option.light.cardHex).toBe(theme.light["card-background-color"])
      expect(option.dark.cardHex).toBe(theme.dark["card-background-color"])
      expect(option.light.boxShadow).toBe(theme.light["ha-box-shadow-s"])
      expect(option.dark.boxShadow).toBe(theme.dark["ha-box-shadow-s"])
    }
  })

  it("names the source hex and the opacity in the accessible name, not color alone", () => {
    const options = getBorderStepOptions(theme)
    const strong = options.find((o) => o.value === "neutral-05")!
    expect(strong.accessibleName).toBe(
      `Strong: light ${strong.light.sourceHex}, dark ${strong.dark.sourceHex}, rendered at 12% opacity`
    )
    const invisible = options.find((o) => o.value === "match-card")!
    expect(invisible.accessibleName).toBe("Invisible: matches the card surface in both modes")
  })
})
