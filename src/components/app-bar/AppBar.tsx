/**
 * The fixed app bar (`docs/UX-SPEC.md` §1.1): product name, the builder's
 * own mode toggle, Reset to defaults, and Export theme. Below `lg` (1024px)
 * it also carries the Design button that undocks the sidebar (§1.5).
 */
import { ExportSheet } from "@/components/app-bar/ExportSheet"
import { MobileSidebarSheet } from "@/components/app-bar/MobileSidebarSheet"
import { ModeToggle } from "@/components/app-bar/ModeToggle"
import { ResetButton } from "@/components/app-bar/ResetButton"
import type { UseRecentColorsResult } from "@/components/sidebar/hooks/use-recent-colors"

export function AppBar({ recentColors }: { recentColors: UseRecentColorsResult }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <h1 className="text-sm font-semibold">HA Theme Builder</h1>
      <div className="flex-1" />
      <MobileSidebarSheet recentColors={recentColors} />
      <ModeToggle />
      <ResetButton recentColors={recentColors} />
      <ExportSheet />
    </header>
  )
}
