import { normalizeHex, type Hex } from "@/engine"

const HEX_FIELD_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export const HEX_FIELD_ERROR_MESSAGE = "Enter a 3 or 6 digit hex color"

/**
 * Parse the text of the hex field into a normalized hex color.
 *
 * Accepted input: 3 or 6 hex digits, in any letter case, with or without
 * a leading "#". Other input gives `null`.
 *
 * @example
 * parseHexFieldInput("ABC") // "#aabbcc"
 * parseHexFieldInput("#12345") // null
 */
export function parseHexFieldInput(raw: string): Hex | null {
  const trimmed = raw.trim()
  if (!HEX_FIELD_RE.test(trimmed)) return null
  return normalizeHex(trimmed)
}
