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
  /** Save a color committed from the free picker or the hex field. */
  readonly commit: (hex: Hex) => void
  /** Reload from storage and drop stale entries. Call it when a popover opens. */
  readonly refresh: () => void
  /** Remove all entries from state and storage. */
  readonly clear: () => void
}

/**
 * Keep the recently used colors, saved in localStorage.
 *
 * Call it once, near the app root. Pass the result to every color picker.
 *
 * @example
 * const recentColors = useRecentColors()
 * recentColors.commit("#009ac7")
 */
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
