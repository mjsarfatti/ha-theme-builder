/**
 * Recent colors persistence (`docs/UX-SPEC.md` §2.6). Shared across all six
 * popover pickers, capped at 8, newest first, with a 7-day staleness period
 * **per entry** — each entry carries its own `lastUsedAt`, and a read drops
 * any entry older than 7 days before returning the list.
 *
 * Pure and side-effect-isolated on purpose: every function here either reads
 * or writes `localStorage` through a single try/catch that never throws, so
 * `useRecentColors` (the React half, in `hooks/use-recent-colors.ts`) can
 * hold its own state as the source of truth for the session even when
 * storage is unavailable (private mode, a full quota, a disabled store).
 */
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
 * Reads the persisted list, drops entries past the staleness window, and
 * (best-effort) writes the pruned list back. Never throws — a storage
 * failure of any kind reads back as an empty list.
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

/** Best-effort write. A failure here is silent — the caller's own state is the fallback. */
export function persistRecentColors(entries: readonly RecentColorEntry[]): void {
  try {
    window.localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage unavailable. Recent still works for the rest of the session
    // from in-memory state; it just won't survive a reload (§2.6).
  }
}

/**
 * Applies one commit to a list: a case-insensitive match moves to the front
 * with a fresh `lastUsedAt`; no match prepends a new entry. Either way the
 * result is trimmed to {@link RECENT_COLORS_CAP}.
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
    // Nothing to fall back to here — the caller also clears its own state.
  }
}
