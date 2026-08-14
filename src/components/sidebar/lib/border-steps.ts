/**
 * The five named steps of the Border color knob (`docs/UX-SPEC.md` §2.5).
 * `NeutralSlotId` stays the engine's own type — this is a UI-only subset of
 * it, plus the `"match-card"` sentinel (§2.7 Change 2).
 *
 * The composited preview each mini-card renders is not exposed by the
 * engine, because the engine only ever computes the *current* border
 * choice, not all five candidates at once. So this module reproduces the
 * engine's own math by hand from public building blocks: the ramp swatch row
 * (`theme.ramps.neutral`), the mirror rule documented in
 * `src/engine/README.md` (`mirrorSlot(s) = 100 - s`), and `withAlpha`. Every
 * one of the four named slots and its mirror (80↔20, 60↔40, 30↔70, 05↔95)
 * stays inside the 11-shade `Ramp` `theme.ramps.neutral` already carries, so
 * this never needs the wider 13-shade preset. `border-steps.test.ts` checks
 * each step against `derive.ts`'s own `divider-color` for the
 * currently-selected step, so a drift between this copy and the engine's own
 * `forMode()` fails a test rather than silently rendering the wrong swatch.
 */
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

/**
 * Computes every named step's light/dark render, for the mini-card list.
 * `theme` supplies the current mode's own already-computed
 * `card-background-color` and `ha-box-shadow-s` — both independent of which
 * step is being rendered, so every option shares the same card and shadow
 * and differs only in its border color.
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
