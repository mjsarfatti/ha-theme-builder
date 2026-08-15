/**
 * The app shell (`docs/UX-SPEC.md` §1.1): a fixed app bar over a sidebar +
 * preview frame. Holds the single `ThemeConfig` store (`src/store/`) and
 * hands its derived theme down to both halves. The preview pane itself is
 * M3's deliverable — see `PreviewPlaceholder` for the integration step.
 */
import { AppBar } from "@/components/app-bar/AppBar"
import { PreviewPlaceholder } from "@/components/PreviewPlaceholder"
import { Sidebar } from "@/components/sidebar/Sidebar"
import { useRecentColors } from "@/components/sidebar/hooks/use-recent-colors"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { ThemeConfigProvider, useThemeConfig } from "@/store/theme-config"

function AppShell() {
  const { theme } = useThemeConfig()
  // One shared instance: the desktop sidebar and its mobile Sheet fallback
  // (§1.5) both read and write the same Recent list, never a copy each.
  const recentColors = useRecentColors()

  return (
    <div className="flex h-svh flex-col">
      <AppBar recentColors={recentColors} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar recentColors={recentColors} />
        <PreviewPlaceholder theme={theme} />
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ThemeConfigProvider>
        <AppShell />
        <Toaster />
      </ThemeConfigProvider>
    </ThemeProvider>
  )
}

export default App
