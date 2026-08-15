/**
 * TEMPORARY. Deleted the moment M3 merges `src/components/preview/index.ts`.
 *
 * M3 owns the real preview pane and exports a single root component:
 *
 * ```ts
 * export function Preview(props: { theme: DerivedTheme }): JSX.Element
 * ```
 *
 * The integration step is one line in `App.tsx`: replace
 * `<PreviewPlaceholder theme={theme} />` with
 * `<Preview theme={theme} />` from `@/components/preview`, and delete this
 * file. Nothing else in the shell changes — `AppShell` already holds the
 * `ThemeConfig` store, calls `derive()` once per change, and hands the
 * result down as `theme`.
 *
 * Until then, this renders the live derived theme as plain data, so a build
 * of the sidebar has something to watch react to a knob change.
 */
import type { DerivedTheme } from "@/engine"

export function PreviewPlaceholder({ theme }: { theme: DerivedTheme }) {
  return (
    <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
      <div className="mx-auto max-w-3xl rounded-lg border border-dashed p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Preview placeholder — M3 replaces this with the real preview pane.
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
          {Object.entries({ ...theme.common, ...theme.light }).map(([key, value]) => (
            <div key={key} className="col-span-2 grid grid-cols-subgrid">
              <dt className="text-muted-foreground">{key}</dt>
              <dd className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block size-3 rounded-sm ring-1 ring-inset ring-black/10"
                  style={{ background: /^#/.test(value) ? value : "transparent" }}
                />
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  )
}
