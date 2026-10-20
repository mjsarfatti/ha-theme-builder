import { PanelLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SidebarContent } from "@/components/sidebar/Sidebar"
import type { UseRecentColorsResult } from "@/components/sidebar/hooks/use-recent-colors"

export function MobileSidebarSheet({
  recentColors,
}: {
  recentColors: UseRecentColorsResult
}) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" />}>
        <PanelLeftIcon data-icon="inline-start" />
        <span className="max-sm:sr-only">Design</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-85">
        <SheetHeader>
          <SheetTitle>Design</SheetTitle>
        </SheetHeader>
        <ScrollArea className="min-h-0 flex-1">
          <SidebarContent recentColors={recentColors} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
