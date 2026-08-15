/**
 * React binding for `lib/recent-colors.ts`. One instance is shared by every
 * popover picker (`docs/UX-SPEC.md` §2.3) — call it once, near the app root,
 * and pass the returned value down.
 */
import * as React from "react"

import type { Hex } from "@/engine"

import {
  clearRecentColors,
  loadRecentColors,
  persistRecentColors,
  withCommittedColor,
  type RecentColorEntry,
} from "@/components/sidebar/lib/recent-colors"

export interface UseRecentColorsResult {
  readonly entries: readonly RecentColorEntry[]
  /** Writes/refreshes an entry for a hex committed from the free picker or the hex field (§2.3). */
  readonly commit: (hex: Hex) => void
  /** Re-reads from storage and prunes stale entries. Call on every popover open (§2.6). */
  readonly refresh: () => void
  /** Clears Recent from both state and storage — used by Reset to defaults (§5.4). */
  readonly clear: () => void
}

export function useRecentColors(): UseRecentColorsResult {
  const [entries, setEntries] = React.useState<readonly RecentColorEntry[]>(() =>
    loadRecentColors()
  )

  const commit = React.useCallback((hex: Hex) => {
    setEntries((current) => {
      const next = withCommittedColor(current, hex)
      persistRecentColors(next)
      return next
    })
  }, [])

  const refresh = React.useCallback(() => {
    setEntries(loadRecentColors())
  }, [])

  const clear = React.useCallback(() => {
    clearRecentColors()
    setEntries([])
  }, [])

  return { entries, commit, refresh, clear }
}
