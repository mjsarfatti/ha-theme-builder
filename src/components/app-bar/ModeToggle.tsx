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
        <span className="max-sm:sr-only">Auto</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="light" aria-label="Light">
        <SunIcon data-icon="inline-start" />
        <span className="max-sm:sr-only">Light</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark">
        <MoonIcon data-icon="inline-start" />
        <span className="max-sm:sr-only">Dark</span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
