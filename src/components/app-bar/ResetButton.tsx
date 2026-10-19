import { RotateCcwIcon } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useThemeConfig } from "@/store/theme-config"
import type { UseRecentColorsResult } from "@/components/sidebar/hooks/use-recent-colors"

export function ResetButton({ recentColors }: { recentColors: UseRecentColorsResult }) {
  const { isDirty, resetToDefaults } = useThemeConfig()

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={!isDirty} />}>
        <RotateCcwIcon className="sm:hidden" />
        <span className="max-sm:sr-only">Reset to defaults</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset to defaults?</AlertDialogTitle>
          <AlertDialogDescription>
            Every knob returns to its starting value. Recent colors are cleared too. This cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel render={<Button variant="outline" />}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            render={
              <Button
                variant="destructive"
                onClick={() => {
                  resetToDefaults()
                  recentColors.clear()
                }}
              />
            }
          >
            Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
