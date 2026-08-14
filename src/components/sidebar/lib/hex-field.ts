/**
 * Hex-field parsing for the popover's own `Input` (`docs/UX-SPEC.md` §2.4).
 * Deliberately stricter than the engine's own `isHex`/`normalizeHex`, which
 * also accept 4- and 8-digit alpha variants: this field's own rule is "3 or
 * 6 digit hex color, any case", full stop — `#abc`, `abc`, `#aabbcc`,
 * `aabbcc`. Once a value passes that check, `normalizeHex` does the actual
 * expansion and lowercasing, so there is still one source of truth for that
 * math.
 */
import { normalizeHex, type Hex } from "@/engine"

const HEX_FIELD_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export const HEX_FIELD_ERROR_MESSAGE = "Enter a 3 or 6 digit hex color"

/** `null` for anything that is not a 3- or 6-digit hex color. */
export function parseHexFieldInput(raw: string): Hex | null {
  const trimmed = raw.trim()
  if (!HEX_FIELD_RE.test(trimmed)) return null
  return normalizeHex(trimmed)
}
