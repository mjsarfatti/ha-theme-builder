/**
 * The six-knob popover color picker (`docs/UX-SPEC.md` §2.2–§2.4): Primary,
 * Accent, Error, Warning, Success, Info. Anatomy top to bottom — header
 * (swatch + hex `Input` + Reset), the entity-palette swatch group, Recent,
 * the free `react-colorful` picker, and a conditional contrast warning.
 */
import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { RotateCcwIcon } from "lucide-react"

import {
  contrastingText,
  contrastRatio,
  getExtendedPalette,
  PALETTE_COLOR_NAMES,
  type ExtendedPaletteId,
  type Hex,
  type PaletteColorName,
} from "@/engine"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ColorSwatchGroup, type ColorSwatchItem } from "@/components/sidebar/ColorSwatchGroup"
import { ContrastWarning } from "@/components/sidebar/ContrastWarning"
import type { UseRecentColorsResult } from "@/components/sidebar/hooks/use-recent-colors"
import { HEX_FIELD_ERROR_MESSAGE, parseHexFieldInput } from "@/components/sidebar/lib/hex-field"
import { paletteRef, resolveSeedColor, type SeedColor } from "@/components/sidebar/lib/seed-color"

const CONTRAST_WARNING_THRESHOLD = 4.5

function paletteColorLabel(name: PaletteColorName): string {
  const spaced = name.replace(/-/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

interface ColorPickerFieldProps {
  readonly label: string
  readonly value: SeedColor
  readonly defaultValue: SeedColor
  readonly paletteId: ExtendedPaletteId
  readonly recentColors: UseRecentColorsResult
  readonly onChange: (seed: SeedColor) => void
}

export function ColorPickerField({
  label,
  value,
  defaultValue,
  paletteId,
  recentColors,
  onChange,
}: ColorPickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  const resolvedHex = resolveSeedColor(value, paletteId)

  const [draftHex, setDraftHex] = React.useState<Hex>(resolvedHex)
  const [hexFieldValue, setHexFieldValue] = React.useState(resolvedHex)
  const [hexFieldInvalid, setHexFieldInvalid] = React.useState(false)
  const hexFieldFocused = React.useRef(false)
  const hexInputRef = React.useRef<HTMLInputElement>(null)
  const rafRef = React.useRef<number | null>(null)

  // Re-sync the draft and the field text from the store whenever the
  // resolved value changes from outside this popover — a palette-ref knob
  // following a preset change, or the trigger being reopened — but never
  // while the field itself is mid-edit.
  React.useEffect(() => {
    if (!hexFieldFocused.current) {
      setDraftHex(resolvedHex)
      setHexFieldValue(resolvedHex)
      setHexFieldInvalid(false)
    }
  }, [resolvedHex])

  React.useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // §6.2 item 9: debounce only the saturation-square drag, to one
  // requestAnimationFrame. Every other change is discrete.
  const throttledCommit = React.useCallback(
    (hex: Hex) => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        onChange(hex)
      })
    },
    [onChange]
  )

  function commitHexField() {
    const parsed = parseHexFieldInput(hexFieldValue)
    if (parsed === null) {
      setHexFieldInvalid(true)
      return
    }
    setHexFieldInvalid(false)
    setDraftHex(parsed)
    setHexFieldValue(parsed)
    onChange(parsed)
    recentColors.commit(parsed)
  }

  const paletteColors = getExtendedPalette(paletteId).colors
  const paletteItems: ColorSwatchItem[] = PALETTE_COLOR_NAMES.map((name) => ({
    key: name,
    hex: paletteColors[name],
    name: paletteColorLabel(name),
  }))
  const recentItems: ColorSwatchItem[] = recentColors.entries.map((entry) => ({
    key: entry.hex,
    hex: entry.hex,
    name: entry.hex,
  }))

  const textColor = contrastingText(resolvedHex)
  const ratio = contrastRatio(resolvedHex, textColor)
  const showContrastWarning = ratio < CONTRAST_WARNING_THRESHOLD

  const isDefault = value === defaultValue

  return (
    <Popover
      open={open}
      onOpenChange={(next, details) => {
        // §2.3 recommended refinement: don't let a click on the Entity
        // colors preset list behind this popover count as an outside press —
        // that's the one moment a user wants to watch this popover's own
        // palette group update live. The spec's own code sample checks
        // `reason === "outsidePress"`; the installed @base-ui/react 1.7.0
        // spells the runtime value `"outside-press"` (kebab-case) even
        // though the JS export it comes from is the camelCase
        // `REASONS.outsidePress` — checked directly against
        // `node_modules/@base-ui/react/internals/reason-parts.d.ts`.
        if (
          !next &&
          details.reason === "outside-press" &&
          (details.event.target as HTMLElement | null)?.closest("[data-preset-list]")
        ) {
          details.cancel()
          return
        }
        setOpen(next)
        if (next) {
          recentColors.refresh()
        }
      }}
    >
      <PopoverTrigger
        aria-label={`${label}, currently ${resolvedHex}`}
        className="flex w-full items-center gap-2.5 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span
          aria-hidden="true"
          className="size-7 shrink-0 rounded-md ring-1 ring-inset ring-black/12"
          style={{ backgroundColor: resolvedHex }}
        />
        <span className="flex-1 text-left">{label}</span>
        <span className="font-mono text-xs text-muted-foreground">{resolvedHex}</span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="right"
        className="w-75 gap-3"
        initialFocus={hexInputRef}
      >
        <PopoverHeader className="gap-2.5">
          <PopoverTitle className="sr-only">{label}</PopoverTitle>
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-9 shrink-0 rounded-md ring-1 ring-inset ring-black/12"
              style={{ backgroundColor: draftHex }}
            />
            <div className="flex flex-1 flex-col gap-1">
              <Input
                ref={hexInputRef}
                value={hexFieldValue}
                aria-label={`${label} hex value`}
                aria-invalid={hexFieldInvalid}
                className="font-mono"
                onFocus={() => {
                  hexFieldFocused.current = true
                }}
                onChange={(event) => {
                  setHexFieldValue(event.target.value)
                  if (hexFieldInvalid) setHexFieldInvalid(false)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitHexField()
                  } else if (event.key === "Escape") {
                    setHexFieldValue(resolvedHex)
                    setHexFieldInvalid(false)
                    event.currentTarget.blur()
                  }
                }}
                onBlur={() => {
                  hexFieldFocused.current = false
                  commitHexField()
                }}
              />
              {hexFieldInvalid ? (
                <p className="text-xs text-destructive">{HEX_FIELD_ERROR_MESSAGE}</p>
              ) : null}
            </div>
            {isDefault ? null : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Reset ${label} to default`}
                onClick={() => {
                  onChange(defaultValue)
                }}
              >
                <RotateCcwIcon />
              </Button>
            )}
          </div>
          <span aria-live="polite" className="sr-only">
            {label} is {draftHex}
          </span>
        </PopoverHeader>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            From your entity colors
          </p>
          <ColorSwatchGroup
            ariaLabel="Entity colors"
            items={paletteItems}
            selectedHex={resolvedHex}
            presetListMarker
            onSelect={(item) => {
              onChange(paletteRef(item.key as PaletteColorName))
            }}
          />
        </div>

        {recentItems.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Recent
            </p>
            <ColorSwatchGroup
              ariaLabel="Recently used colors"
              items={recentItems}
              selectedHex={resolvedHex}
              onSelect={(item) => {
                onChange(item.hex)
              }}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5 border-t pt-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Pick a color
          </p>
          <div role="group" aria-label="Pick a custom color" className={cn("ha-color-picker")}>
            <HexColorPicker
              color={draftHex}
              onChange={(hex) => {
                setDraftHex(hex)
                setHexFieldValue(hex)
                throttledCommit(hex)
              }}
              onChangeEnd={(hex) => {
                onChange(hex)
                recentColors.commit(hex)
              }}
            />
          </div>
        </div>

        {showContrastWarning ? (
          <ContrastWarning>
            {textColor === "#ffffff" ? "White" : "Dark"} text on this color is hard to read.
          </ContrastWarning>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
