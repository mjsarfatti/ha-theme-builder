import { withAlpha, type DerivedTheme, type Hex, type RampSlot, type NeutralSlotId } from "@/engine"

/** `mirrorSlot(s) = 100 - s` — README, "How colors are derived → Dark mode". */
export function mirrorSlot(slot: RampSlot): RampSlot {
  return (100 - slot) as RampSlot
}

export interface BorderStepDefinition {
  readonly value: NeutralSlotId | "match-card"
  readonly label: string
  readonly slot: RampSlot | null
}

/** Darkest to lightest is Strong → Hairline; `"match-card"` (Invisible) is a fifth, separate option. */
export const BORDER_STEPS: readonly BorderStepDefinition[] = [
  { value: "match-card", label: "Invisible", slot: null },
  { value: "neutral-80", label: "Hairline", slot: 80 },
  { value: "neutral-60", label: "Subtle", slot: 60 },
  { value: "neutral-30", label: "Medium", slot: 30 },
  { value: "neutral-05", label: "Strong", slot: 5 },
]

export interface BorderStepRender {
  readonly cardHex: Hex
  /** The color composited at 12% alpha (`1f`) — the border's own source hex, before the alpha. */
  readonly sourceHex: Hex
  /** `sourceHex` at `1f` alpha, ready for a CSS `border-color`. */
  readonly borderColor: Hex
  readonly boxShadow: string
}

export interface BorderStepOption extends BorderStepDefinition {
  readonly light: BorderStepRender
  readonly dark: BorderStepRender
  readonly accessibleName: string
}

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
