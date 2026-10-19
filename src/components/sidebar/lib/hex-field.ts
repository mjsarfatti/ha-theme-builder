import { normalizeHex, type Hex } from "@/engine"

const HEX_FIELD_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export const HEX_FIELD_ERROR_MESSAGE = "Enter a 3 or 6 digit hex color"

/** `null` for anything that is not a 3- or 6-digit hex color. */
export function parseHexFieldInput(raw: string): Hex | null {
  const trimmed = raw.trim()
  if (!HEX_FIELD_RE.test(trimmed)) return null
  return normalizeHex(trimmed)
}
