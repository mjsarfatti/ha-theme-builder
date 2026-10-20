import { AppBar } from "@/components/app-bar/AppBar"
import { Preview } from "@/components/preview"
import { Sidebar } from "@/components/sidebar/Sidebar"
import { useRecentColors } from "@/components/sidebar/hooks/use-recent-colors"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { ThemeConfigProvider, useThemeConfig } from "@/store/theme-config"

function AppShell() {
  const { theme } = useThemeConfig()
  // One instance: the docked sidebar and the mobile sheet share the Recent list.
  const recentColors = useRecentColors()

  return (
    <div className="flex h-svh flex-col">
      <AppBar recentColors={recentColors} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar recentColors={recentColors} />
        <Preview theme={theme} />
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
