import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  RECENT_COLORS_CAP,
  RECENT_COLORS_STALE_MS,
  RECENT_COLORS_STORAGE_KEY,
  clearRecentColors,
  loadRecentColors,
  persistRecentColors,
  withCommittedColor,
  type RecentColorEntry,
} from "./recent-colors"

function write(entries: RecentColorEntry[]) {
  window.localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(entries))
}

beforeEach(() => {
  window.localStorage.clear()
})

describe("loadRecentColors", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(loadRecentColors()).toEqual([])
  })

  it("returns stored entries newest-first, as written", () => {
    const now = Date.now()
    write([
      { hex: "#111111", lastUsedAt: now },
      { hex: "#222222", lastUsedAt: now - 1000 },
    ])
    expect(loadRecentColors(now)).toEqual([
      { hex: "#111111", lastUsedAt: now },
      { hex: "#222222", lastUsedAt: now - 1000 },
    ])
  })

  it("drops an entry older than the 7-day staleness window (§2.6)", () => {
    const now = Date.now()
    const fresh: RecentColorEntry = { hex: "#111111", lastUsedAt: now - 1000 }
    const stale: RecentColorEntry = {
      hex: "#222222",
      lastUsedAt: now - RECENT_COLORS_STALE_MS - 1,
    }
    write([fresh, stale])

    const result = loadRecentColors(now)

    expect(result).toEqual([fresh])
  })

  it("keeps an entry exactly at the boundary — only strictly older is stale", () => {
    const now = Date.now()
    const atBoundary: RecentColorEntry = {
      hex: "#111111",
      lastUsedAt: now - RECENT_COLORS_STALE_MS + 1,
    }
    write([atBoundary])

    expect(loadRecentColors(now)).toEqual([atBoundary])
  })

  it("staleness is per entry, not per list — pruning one leaves the rest", () => {
    const now = Date.now()
    const a: RecentColorEntry = { hex: "#111111", lastUsedAt: now }
    const b: RecentColorEntry = {
      hex: "#222222",
      lastUsedAt: now - RECENT_COLORS_STALE_MS - 1,
    }
    const c: RecentColorEntry = { hex: "#333333", lastUsedAt: now - 2000 }
    write([a, b, c])

    expect(loadRecentColors(now)).toEqual([a, c])
  })

  it("writes the pruned list back to storage", () => {
    const now = Date.now()
    const fresh: RecentColorEntry = { hex: "#111111", lastUsedAt: now }
    const stale: RecentColorEntry = {
      hex: "#222222",
      lastUsedAt: now - RECENT_COLORS_STALE_MS - 1,
    }
    write([fresh, stale])

    loadRecentColors(now)

    const persisted = JSON.parse(window.localStorage.getItem(RECENT_COLORS_STORAGE_KEY) ?? "[]")
    expect(persisted).toEqual([fresh])
  })

  it("never throws on malformed JSON, and reads back as empty", () => {
    window.localStorage.setItem(RECENT_COLORS_STORAGE_KEY, "{not json")
    expect(() => loadRecentColors()).not.toThrow()
    expect(loadRecentColors()).toEqual([])
  })

  it("ignores entries with the wrong shape", () => {
    window.localStorage.setItem(
      RECENT_COLORS_STORAGE_KEY,
      JSON.stringify([{ hex: "#111111" }, { lastUsedAt: 123 }, "not an object", null])
    )
    expect(loadRecentColors()).toEqual([])
  })

  it("never throws when localStorage.getItem throws", () => {
    const spy = vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    expect(() => loadRecentColors()).not.toThrow()
    expect(loadRecentColors()).toEqual([])
    spy.mockRestore()
  })
})

describe("withCommittedColor", () => {
  it("prepends a new entry, newest first", () => {
    const now = Date.now()
    const result = withCommittedColor([{ hex: "#111111", lastUsedAt: now - 1 }], "#abcdef", now)
    expect(result[0]).toEqual({ hex: "#abcdef", lastUsedAt: now })
    expect(result[1]).toEqual({ hex: "#111111", lastUsedAt: now - 1 })
  })

  it("moves a case-insensitive match to the front with a fresh lastUsedAt", () => {
    const now = Date.now()
    const existing: RecentColorEntry[] = [
      { hex: "#111111", lastUsedAt: now - 5000 },
      { hex: "#ABCDEF", lastUsedAt: now - 3000 },
    ]

    const result = withCommittedColor(existing, "#abcdef", now)

    expect(result).toEqual([
      { hex: "#abcdef", lastUsedAt: now },
      { hex: "#111111", lastUsedAt: now - 5000 },
    ])
  })

  it("caps the list at 8, dropping the oldest", () => {
    const now = Date.now()
    const existing: RecentColorEntry[] = Array.from({ length: RECENT_COLORS_CAP }, (_, i) => ({
      hex: `#00000${i}`,
      lastUsedAt: now - i,
    }))

    const result = withCommittedColor(existing, "#ffffff", now)

    expect(result).toHaveLength(RECENT_COLORS_CAP)
    expect(result[0]).toEqual({ hex: "#ffffff", lastUsedAt: now })
    // The oldest entry (last in the newest-first list) was dropped.
    expect(result.at(-1)).toEqual(existing.at(-2))
  })
})

describe("persistRecentColors", () => {
  it("never throws when localStorage.setItem throws", () => {
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded")
    })
    expect(() => persistRecentColors([{ hex: "#111111", lastUsedAt: Date.now() }])).not.toThrow()
    spy.mockRestore()
  })
})

describe("clearRecentColors", () => {
  it("removes the storage key", () => {
    write([{ hex: "#111111", lastUsedAt: Date.now() }])
    clearRecentColors()
    expect(window.localStorage.getItem(RECENT_COLORS_STORAGE_KEY)).toBeNull()
  })

  it("never throws when localStorage.removeItem throws", () => {
    const spy = vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => {
      throw new Error("storage disabled")
    })
    expect(() => clearRecentColors()).not.toThrow()
    spy.mockRestore()
  })
})
