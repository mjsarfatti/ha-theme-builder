import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { derive, toCssProperties } from "@/engine"
import type { CSSProperties } from "react"
import { LivingRoomSection } from "../sections/LivingRoomSection"

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(|\b(?:white|black)\b/i

// Vitest returns CSS imports empty, so the test reads the file from disk.
const indexCss = readFileSync(resolve(import.meta.dirname, "../../../index.css"), "utf8")
const SHADCN_TOKENS = [...indexCss.matchAll(/--color-([\w-]+):/g)].map((m) => m[1])
const COLOR_PREFIX =
  "(?:bg|text|border(?:-[xytrblse])?|outline|ring(?:-offset)?|inset-ring|shadow|inset-shadow|text-shadow|drop-shadow|fill|stroke|decoration|divide|from|via|to|accent|caret|placeholder)"
// Palette steps are 50, 100 to 900 and 950, so a new Tailwind palette name is also caught.
const COLOR_VALUE = `(?:${SHADCN_TOKENS.join("|")}|white|black|[a-z]+-(?:50|[1-9]00|950))`
const COLOR_UTILITY = new RegExp(`^${COLOR_PREFIX}-${COLOR_VALUE}(?:/\\S+)?$`)

/**
 * Tells if a class string has a color class that does not come from the HA theme.
 *
 * It strips variants (`hover:`, `dark:`) and the `!` and `-` modifiers
 * from each class. It then finds shadcn token utilities (names read from
 * `index.css`), Tailwind palette utilities and arbitrary color values.
 *
 * @example
 * hasForeignColorClass("hover:bg-primary/50") // true
 * hasForeignColorClass("rounded-lg text-sm") // false
 */
function hasForeignColorClass(classes: string) {
  return classes.split(/\s+/).some((cls) => {
    const utility = (cls.split(":").pop() ?? "").replace(/^[!-]+|!$/g, "")
    // Tailwind writes spaces as `_`, which hides the word boundary before `rgba(`.
    const arbitrary = (cls.match(/\[(.*)\]/)?.[1] ?? "").replaceAll("_", " ")
    return COLOR_UTILITY.test(utility) || COLOR_LITERAL.test(arbitrary)
  })
}

function renderSection() {
  const theme = derive()
  return render(
    <LivingRoomSection
      theme={theme}
      lightVars={toCssProperties(theme, "light") as CSSProperties}
      darkVars={toCssProperties(theme, "dark") as CSSProperties}
    />,
  )
}

/**
 * Every element inside a preview panel, without the panels that hold the theme values.
 *
 * Elements marked `data-ha-hardcoded` copy a literal that Home Assistant itself hardcodes.
 */
function demoElements(container: HTMLElement) {
  return [...container.querySelectorAll("[data-preview-mode] *:not([data-ha-hardcoded])")]
}

describe("LivingRoomSection", () => {
  it("uses only theme variables for color: no color literal in any inline style", () => {
    const { container } = renderSection()
    const offenders = demoElements(container)
      .map((el) => el.getAttribute("style") ?? "")
      .filter((style) => COLOR_LITERAL.test(style))
    expect(offenders).toEqual([])
  })

  it("exempts only the slider thumb, which HA hardcodes white", () => {
    const { container } = renderSection()
    const exempt = [...container.querySelectorAll("[data-ha-hardcoded]")]
    expect(exempt.map((el) => (el as HTMLElement).style.background)).toEqual(["white", "white"])
  })

  it("uses no shadcn token, Tailwind palette or arbitrary color class inside a panel", () => {
    const { container } = renderSection()
    const offenders = demoElements(container)
      .map((el) => el.getAttribute("class") ?? "")
      .filter(hasForeignColorClass)
    expect(offenders).toEqual([])
  })

  it("reads the shadcn token names from index.css", () => {
    expect(SHADCN_TOKENS).toEqual(expect.arrayContaining(["primary", "muted-foreground", "border"]))
  })

  it.each([
    "bg-primary",
    "text-muted-foreground",
    "border-border",
    "ring-ring",
    "fill-card",
    "stroke-chart-1",
    "outline-input",
    "decoration-accent",
    "divide-border",
    "from-primary",
    "via-secondary",
    "to-destructive",
    "shadow-popover",
    "accent-primary",
    "caret-foreground",
    "border-t-sidebar-border",
    "ring-offset-background",
    "hover:bg-primary",
    "dark:text-foreground",
    "bg-primary/50",
    "dark:hover:bg-accent/[0.3]",
    "!bg-primary",
    "bg-red-500",
    "text-white",
    "bg-black",
    "border-zinc-50",
    "bg-[#fff]",
    "text-[rgb(0,0,0)]",
    "border-[color:oklch(0.5_0.1_200)]",
    "shadow-[0_0_0_1px_rgba(0,0,0,0.1)]",
    "[background:#fff]",
    "flex bg-[white]",
  ])("flags %s", (cls) => {
    expect(hasForeignColorClass(cls)).toBe(true)
  })

  it.each([
    "rounded-lg",
    "text-sm",
    "border",
    "flex",
    "border-2",
    "ring-1",
    "shadow-sm",
    "outline-1",
    "-outline-offset-1",
    "size-[18px]",
    "-translate-x-[9px]",
    "text-base font-medium",
    "fill-current",
    "bg-transparent",
  ])("passes %s", (cls) => {
    expect(hasForeignColorClass(cls)).toBe(false)
  })

  it("is inert: nothing in the demo enters the tab order", () => {
    const { container } = renderSection()
    expect(container.querySelectorAll("a, button, input, select, textarea, [tabindex]")).toHaveLength(0)
  })

  it("renders the room card and the second card in both modes", () => {
    const { getAllByText } = renderSection()
    expect(getAllByText("Spotlights")).toHaveLength(2)
    expect(getAllByText("Garage door")).toHaveLength(2)
  })
})
