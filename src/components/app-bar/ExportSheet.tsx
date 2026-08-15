/**
 * The export panel shell (`docs/UX-SPEC.md` §1.4). This is the app bar
 * button and the sheet itself — theme name field, `Tabs` for YAML/Install.
 * The generated YAML, the Copy/Download actions and the install steps are
 * M6's deliverable; the placeholders below mark exactly where that content
 * lands.
 */
import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useThemeConfig } from "@/store/theme-config"

export function ExportSheet() {
  const { config, updateConfig } = useThemeConfig()

  return (
    <Sheet>
      <SheetTrigger render={<Button size="sm" />}>
        <DownloadIcon data-icon="inline-start" />
        Export theme
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[560px]">
        <SheetHeader>
          <SheetTitle className="sr-only">Export theme</SheetTitle>
          <Field>
            <FieldLabel htmlFor="export-theme-name">Theme name</FieldLabel>
            <Input
              id="export-theme-name"
              value={config.name}
              onChange={(event) => updateConfig({ name: event.target.value })}
            />
          </Field>
        </SheetHeader>
        <Tabs defaultValue="yaml" className="flex-1 px-4">
          <TabsList>
            <TabsTrigger value="yaml">YAML</TabsTrigger>
            <TabsTrigger value="install">Install</TabsTrigger>
          </TabsList>
          <TabsContent value="yaml" className="text-sm text-muted-foreground">
            The generated YAML, with Copy and Download, lands here in M6.
          </TabsContent>
          <TabsContent value="install" className="text-sm text-muted-foreground">
            The install steps, including the web-font snippet, land here in M6.
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
