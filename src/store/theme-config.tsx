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

function configsEqual(a: ThemeConfig, b: ThemeConfig): boolean {
  // ThemeConfig is plain JSON, so a string compare is exact.
  return JSON.stringify(a) === JSON.stringify(b)
}

interface ThemeConfigContextValue {
  readonly config: ThemeConfig
  readonly theme: DerivedTheme
  /** Merge a partial config. `fonts` and `colors` merge one level deep. */
  readonly updateConfig: (patch: PartialThemeConfig) => void
  /** Replace the whole config. */
  readonly setConfig: (config: ThemeConfig) => void
  readonly resetToDefaults: () => void
  /** `true` when any field differs from `DEFAULT_CONFIG`. */
  readonly isDirty: boolean
}

const ThemeConfigContext = React.createContext<ThemeConfigContextValue | undefined>(
  undefined
)

/**
 * Store for the app's `ThemeConfig` and its derived theme.
 *
 * Every knob writes one field of the config through `useThemeConfig`.
 * The provider runs `derive()` once per config change.
 */
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

/**
 * Read the config, its derived theme and the mutators.
 *
 * @example
 * const { config, updateConfig } = useThemeConfig()
 * updateConfig({ neutralRamp: "mauve" })
 */
export function useThemeConfig(): ThemeConfigContextValue {
  const context = React.useContext(ThemeConfigContext)
  if (context === undefined) {
    throw new Error("useThemeConfig must be used within a ThemeConfigProvider")
  }
  return context
}

/** Read only the derived theme. */
export function useDerivedTheme(): DerivedTheme {
  return useThemeConfig().theme
}
