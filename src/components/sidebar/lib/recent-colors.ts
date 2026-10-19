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

/** Best-effort write. A failure here is silent — the caller's own state is the fallback. */
export function persistRecentColors(entries: readonly RecentColorEntry[]): void {
  try {
    window.localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(entries))
  } catch {
  }
}

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
    // Nothing to fall back to here — the caller also clears its own state.
  }
}
