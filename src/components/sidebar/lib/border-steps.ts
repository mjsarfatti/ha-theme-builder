import { withAlpha, type DerivedTheme, type Hex, type RampSlot, type NeutralSlotId } from "@/engine"

/**
 * Dark-mode counterpart of a neutral slot (`100 - slot`).
 *
 * @example
 * mirrorSlot(80) // 20
 */
export function mirrorSlot(slot: RampSlot): RampSlot {
  return (100 - slot) as RampSlot
}

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
 * The engine derives only the selected border. This function derives all
 * five steps from the neutral ramp, the mirror rule and `withAlpha`.
 *
 * Every option shares the card background and shadow of `theme`. Only the
 * border color differs.
 *
 * A test compares the result with the engine's `divider-color`, so a
 * drift between the two fails the test.
 */
export function getBorderStepOptions(theme: DerivedTheme): readonly BorderStepOption[] {
  const ramp = theme.ramps.neutral
  const lightCard = theme.light["card-background-color"]
  const darkCard = theme.dark["card-background-color"]
  const lightShadow = theme.light["ha-box-shadow-s"]
  const darkShadow = theme.dark["ha-box-shadow-s"]

  const render = (slot: RampSlot | null, mode: "light" | "dark"): BorderStepRender => {
    const cardHex = mode === "light" ? lightCard : darkCard
    const boxShadow = mode === "light" ? lightShadow : darkShadow
    if (slot === null) {
      return { cardHex, sourceHex: cardHex, borderColor: withAlpha(cardHex, "1f"), boxShadow }
    }
    const resolvedSlot = mode === "dark" ? mirrorSlot(slot) : slot
    const sourceHex = ramp[resolvedSlot]
    return { cardHex, sourceHex, borderColor: withAlpha(sourceHex, "1f"), boxShadow }
  }

  return BORDER_STEPS.map((step) => {
    const light = render(step.slot, "light")
    const dark = render(step.slot, "dark")
    const accessibleName =
      step.value === "match-card"
        ? "Invisible: matches the card surface in both modes"
        : `${step.label}: light ${light.sourceHex}, dark ${dark.sourceHex}, rendered at 12% opacity`
    return { ...step, light, dark, accessibleName }
  })
}
