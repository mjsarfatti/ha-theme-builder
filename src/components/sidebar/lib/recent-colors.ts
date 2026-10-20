import type { Hex } from "@/engine"

export interface RecentColorEntry {
  readonly hex: Hex
  readonly lastUsedAt: number
}

export const RECENT_COLORS_STORAGE_KEY = "ha-theme-builder:recent-colors"
export const RECENT_COLORS_CAP = 8
export const RECENT_COLORS_STALE_MS = 7 * 24 * 60 * 60 * 1000

function isRecentColorEntry(value: unknown): value is RecentColorEntry {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.hex === "string" && typeof candidate.lastUsedAt === "number"
}

function parseEntries(raw: string | null): RecentColorEntry[] {
  if (!raw) return []
  const data: unknown = JSON.parse(raw)
  if (!Array.isArray(data)) return []
  return data.filter(isRecentColorEntry)
}

/**
 * Read the saved colors and drop the entries older than 7 days.
 *
 * Return an empty list when storage is unavailable.
 */
export function loadRecentColors(now: number = Date.now()): RecentColorEntry[] {
  try {
    const parsed = parseEntries(window.localStorage.getItem(RECENT_COLORS_STORAGE_KEY))
    const fresh = parsed.filter((entry) => now - entry.lastUsedAt < RECENT_COLORS_STALE_MS)
    if (fresh.length !== parsed.length) {
      persistRecentColors(fresh)
    }
    return fresh
  } catch {
    return []
  }
}

export function persistRecentColors(entries: readonly RecentColorEntry[]): void {
  try {
    window.localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage can be unavailable (private mode, full quota). The hook keeps the list in memory.
  }
}

/**
 * Put a color at the front of the list with a new timestamp.
 *
 * A color already in the list (any letter case) moves to the front.
 * The list keeps at most `RECENT_COLORS_CAP` entries.
 */
export function withCommittedColor(
  entries: readonly RecentColorEntry[],
  hex: Hex,
  now: number = Date.now()
): RecentColorEntry[] {
  const normalized = hex.toLowerCase()
  const withoutMatch = entries.filter((entry) => entry.hex.toLowerCase() !== normalized)
  return [{ hex, lastUsedAt: now }, ...withoutMatch].slice(0, RECENT_COLORS_CAP)
}

export function clearRecentColors(): void {
  try {
    window.localStorage.removeItem(RECENT_COLORS_STORAGE_KEY)
  } catch {
    // Storage can be unavailable. The hook clears its own state.
  }
}
