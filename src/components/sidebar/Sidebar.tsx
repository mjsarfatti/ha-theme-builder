/**
 * The knob sidebar (`docs/UX-SPEC.md` §3.1, §1.5): five permanently-open
 * groups in one scroll, never an accordion. `SidebarContent` is the shared
 * body — `Sidebar` docks it in a fixed-width `<aside>` at `lg` (1024px) and
 * up, narrowing at the two breakpoints §1.5 sets (300px / 320px / 340px).
 * Below that, `MobileSidebarSheet` (in `app-bar/`) renders the same content
 * inside a left `Sheet`, since it needs the app bar's own trigger button.
 * Every knob here writes one field of `ThemeConfig` (§6.2 item 0).
 */
import type { ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useThemeConfig } from "@/store/theme-config"
import type { UseRecentColorsResult } from "@/components/sidebar/hooks/use-recent-colors"
import { BaseToneGroup } from "@/components/sidebar/groups/BaseToneGroup"
import { BrandStatusGroup } from "@/components/sidebar/groups/BrandStatusGroup"
import { EntityColorsGroup } from "@/components/sidebar/groups/EntityColorsGroup"
import { SurfacesGroup } from "@/components/sidebar/groups/SurfacesGroup"
import { TypographyGroup } from "@/components/sidebar/groups/TypographyGroup"

function SidebarGroupHeading({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-sidebar px-4 pt-4 pb-2">
      <div className="mb-2 h-px bg-border" aria-hidden="true" />
      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {children}
      </h2>
    </div>
  )
}

/** The five groups, with no opinion on how they're docked. */
export function SidebarContent({ recentColors }: { recentColors: UseRecentColorsResult }) {
  const { config, theme, updateConfig } = useThemeConfig()

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-8">
      <p className="text-sm text-muted-foreground">
        Turn the knobs on the left. Everything updates live, in light and dark at once.
      </p>

      <div className="flex flex-col gap-4">
        <SidebarGroupHeading>Typography</SidebarGroupHeading>
        <TypographyGroup
          bodyFont={config.fonts.body}
          onChange={(fontId) =>
            updateConfig({ fonts: { body: fontId, heading: fontId, longform: fontId } })
          }
        />
      </div>

      <div className="flex flex-col gap-4">
        <SidebarGroupHeading>Brand & status colors</SidebarGroupHeading>
        <BrandStatusGroup
          colors={config.colors}
          palette={config.palette}
          recentColors={recentColors}
          onChange={(key, value) => updateConfig({ colors: { [key]: value } })}
        />
      </div>

      <div className="flex flex-col gap-4">
        <SidebarGroupHeading>Base tone</SidebarGroupHeading>
        <BaseToneGroup
          neutralRamp={config.neutralRamp}
          theme={theme}
          onChange={(id) => updateConfig({ neutralRamp: id })}
        />
      </div>

      <div className="flex flex-col gap-4">
        <SidebarGroupHeading>Surfaces</SidebarGroupHeading>
        <SurfacesGroup
          config={config}
          theme={theme}
          onChangeCardBackground={(value) => updateConfig({ cardBackground: value })}
          onChangePrimaryBackground={(value) => updateConfig({ primaryBackground: value })}
          onChangeBorderColor={(value) => updateConfig({ borderColor: value })}
        />
      </div>

      <div className="flex flex-col gap-4">
        <SidebarGroupHeading>Entity colors</SidebarGroupHeading>
        <EntityColorsGroup
          palette={config.palette}
          onChange={(id) => updateConfig({ palette: id })}
        />
      </div>
    </div>
  )
}

/**
 * The desktop docked sidebar — hidden below `lg` (1024px), where the app
 * bar's Design button takes over (§1.5). `recentColors` is a single instance
 * owned by the app shell and shared with `MobileSidebarSheet`, so Recent
 * stays one list regardless of which docking mode is visible.
 */
export function Sidebar({ recentColors }: { recentColors: UseRecentColorsResult }) {
  return (
    <aside className="hidden shrink-0 border-r bg-sidebar lg:block lg:w-75 xl:w-80 min-[1440px]:w-85">
      <ScrollArea className="h-full">
        <SidebarContent recentColors={recentColors} />
      </ScrollArea>
    </aside>
  )
}
