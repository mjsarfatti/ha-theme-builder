import { describe, expect, it } from "vitest"

import { derive } from "@/engine"

import { BORDER_STEPS, getBorderStepOptions } from "./border-steps"

describe("getBorderStepOptions", () => {
  // Card background and shadow stay equal for every borderColor, so one theme serves all steps.
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

  it("Strong (neutral-05) reads neutral-05 in light mode and neutral-95 in dark mode at the default card", () => {
    const options = getBorderStepOptions(theme)
    const strong = options.find((o) => o.value === "neutral-05")!
    expect(strong.light.sourceHex).toBe(theme.ramps.neutral[5])
    expect(strong.dark.sourceHex).toBe(theme.ramps.neutral[95])
  })

  it("scales the steps to the card: Hairline is neutral-60 on a neutral-80 card", () => {
    const options = getBorderStepOptions(derive({ cardBackground: "neutral-80" }))
    const hairline = options.find((o) => o.value === "neutral-80")!
    expect(hairline.light.sourceHex).toBe(derive({}).ramps.neutral[60])
  })

  it("no border step equals the card, for every surface choice and mode", () => {
    const choices = ["neutral-100", "neutral-95", "neutral-90", "neutral-80"] as const
    for (const card of choices) {
      for (const page of choices) {
        const options = getBorderStepOptions(
          derive({ cardBackground: card, primaryBackground: page })
        )
        for (const option of options.filter((o) => o.value !== "match-card")) {
          expect(option.light.sourceHex).not.toBe(option.light.cardHex)
          expect(option.dark.sourceHex).not.toBe(option.dark.cardHex)
        }
      }
    }
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
