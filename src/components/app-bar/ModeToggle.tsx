/**
 * The app bar's own light/dark/auto toggle (`docs/UX-SPEC.md` §1.1). This
 * changes the builder's own chrome only — a separate control from the
 * preview, which always renders both modes side by side and never reads
 * this value.
 */
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useTheme, type Theme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <ToggleGroup
      aria-label="Builder color scheme"
      value={[theme]}
      onValueChange={(next) => {
        const [value] = next as [Theme | undefined]
        if (value) setTheme(value)
      }}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="auto" aria-label="Auto">
        <MonitorIcon data-icon="inline-start" />
        Auto
      </ToggleGroupItem>
      <ToggleGroupItem value="light" aria-label="Light">
        <SunIcon data-icon="inline-start" />
        Light
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark">
        <MoonIcon data-icon="inline-start" />
        Dark
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
