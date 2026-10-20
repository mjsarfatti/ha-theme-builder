import { derive, type DerivedTheme, type Hex, type RampSlot, type NeutralSlotId } from "@/engine"

export interface BorderStepDefinition {
  readonly value: NeutralSlotId | "match-card"
  readonly label: string
  readonly slot: RampSlot | null
}

/** Border color options, from Invisible (`"match-card"`) to Strong. */
export const BORDER_STEPS: readonly BorderStepDefinition[] = [
  { value: "match-card", label: "Invisible", slot: null },
  { value: "neutral-80", label: "Hairline", slot: 80 },
  { value: "neutral-60", label: "Subtle", slot: 60 },
  { value: "neutral-30", label: "Medium", slot: 30 },
  { value: "neutral-05", label: "Strong", slot: 5 },
]

export interface BorderStepRender {
  readonly cardHex: Hex
  /** Ramp color the border derives from, before alpha. */
  readonly sourceHex: Hex
  /** `sourceHex` at 12% alpha, ready for a CSS `border-color`. */
  readonly borderColor: Hex
  readonly boxShadow: string
}

export interface BorderStepOption extends BorderStepDefinition {
  readonly light: BorderStepRender
  readonly dark: BorderStepRender
  readonly accessibleName: string
}

/**
 * Build the light and dark render data for every Border color step.
 *
 * Each step runs through `derive()` with the current config, so the
 * swatches show the border that the exported theme contains.
 *
 * Every option shares the card background and shadow of `theme`. Only the
 * border color differs.
 */
export function getBorderStepOptions(theme: DerivedTheme): readonly BorderStepOption[] {
  return BORDER_STEPS.map((step) => {
    const stepTheme = derive({ ...theme.config, borderColor: step.value })
    const render = (mode: "light" | "dark"): BorderStepRender => {
      const vars = stepTheme[mode]
      const borderColor = vars["divider-color"] as Hex
      return {
        cardHex: theme[mode]["card-background-color"] as Hex,
        sourceHex: borderColor.slice(0, 7) as Hex,
        borderColor,
        boxShadow: theme[mode]["ha-box-shadow-s"],
      }
    }
    const light = render("light")
    const dark = render("dark")
    const accessibleName =
      step.value === "match-card"
        ? "Invisible: matches the card surface in both modes"
        : `${step.label}: light ${light.sourceHex}, dark ${dark.sourceHex}, rendered at 12% opacity`
    return { ...step, light, dark, accessibleName }
  })
}
