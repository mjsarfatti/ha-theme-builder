/**
 * The app's single store. Per `docs/UX-SPEC.md` §6.2 item 0, the store *is*
 * `ThemeConfig`, verbatim — no parallel UI-state shape. Every knob in
 * `src/components/sidebar/` writes one field of this config, through
 * {@link useThemeConfig}. `resolveConfig()` and `DEFAULT_CONFIG` (both from
 * the engine) give the load state and the "is it dirty?" comparison for
 * free, so this file adds no defaults of its own.
 *
 * `derive()` is not free — README calls out that a knob's own popover only
 * needs the config, not the full derived theme. This module still runs it
 * once per config change, memoized, because two sidebar controls need the
 * derived values: the border knob's five mini-cards read the current mode's
 * `card-background-color` (§2.5), and the base-tone group's contrast warning
 * reads `secondary-text-color` against it (§5.3). Both call sites consume
 * {@link useDerivedTheme} rather than re-deriving themselves.
 */
import * as React from "react"

import {
  DEFAULT_CONFIG,
  derive,
  resolveConfig,
  type DerivedTheme,
  type PartialThemeConfig,
  type ThemeConfig,
} from "@/engine"

function mergeConfig(base: ThemeConfig, patch: PartialThemeConfig): ThemeConfig {
  return {
    ...base,
    ...patch,
    fonts: patch.fonts ? { ...base.fonts, ...patch.fonts } : base.fonts,
    colors: patch.colors ? { ...base.colors, ...patch.colors } : base.colors,
  }
}

/** Every field of `ThemeConfig` is plain JSON, so a deep structural compare is exact. */
function configsEqual(a: ThemeConfig, b: ThemeConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

interface ThemeConfigContextValue {
  readonly config: ThemeConfig
  readonly theme: DerivedTheme
  /** Merges a partial config into the store. Nested `fonts`/`colors` merge one level deep. */
  readonly updateConfig: (patch: PartialThemeConfig) => void
  /** Replaces the whole config outright — used by import/reset, never by a single knob. */
  readonly setConfig: (config: ThemeConfig) => void
  readonly resetToDefaults: () => void
  /** `true` once any field differs from `DEFAULT_CONFIG` (§5.1). */
  readonly isDirty: boolean
}

const ThemeConfigContext = React.createContext<ThemeConfigContextValue | undefined>(
  undefined
)

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<ThemeConfig>(() => resolveConfig())

  const updateConfig = React.useCallback((patch: PartialThemeConfig) => {
    setConfig((current) => mergeConfig(current, patch))
  }, [])

  const resetToDefaults = React.useCallback(() => {
    setConfig(DEFAULT_CONFIG)
  }, [])

  const theme = React.useMemo(() => derive(config), [config])
  const isDirty = React.useMemo(() => !configsEqual(config, DEFAULT_CONFIG), [config])

  const value = React.useMemo<ThemeConfigContextValue>(
    () => ({ config, theme, updateConfig, setConfig, resetToDefaults, isDirty }),
    [config, theme, updateConfig, resetToDefaults, isDirty]
  )

  return (
    <ThemeConfigContext.Provider value={value}>{children}</ThemeConfigContext.Provider>
  )
}

/** The full store: config, its derived theme, and the mutators every knob needs. */
export function useThemeConfig(): ThemeConfigContextValue {
  const context = React.useContext(ThemeConfigContext)
  if (context === undefined) {
    throw new Error("useThemeConfig must be used within a ThemeConfigProvider")
  }
  return context
}

/** Convenience for a consumer that only reads the derived theme (e.g. the preview slot). */
export function useDerivedTheme(): DerivedTheme {
  return useThemeConfig().theme
}
