import type { CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"
import type { ThemeMode } from "@/engine"

interface PreviewPanelProps {
  /** The mode this panel renders. Purely a label (`data-preview-mode`) — the
   * panel does not read it, `vars` already carries the resolved variables. */
  mode: ThemeMode
  /** `toCssProperties(theme, mode)`. Never `theme.light` / `theme.dark` alone. */
  vars: CSSProperties
  className?: string
  children: ReactNode
}

/**
 * A scoped preview container for one mode (UX-SPEC §1.2, CLAUDE.md). Every
 * `--ha-*` and legacy variable lives on this element's own `style`, set from
 * `vars` — never on `:root` — so the builder's own Tailwind/shadcn theme
 * cannot leak in and this panel's theme cannot leak out.
 *
 * The panel's background and border read the theme's own variables, because
 * the frame is itself part of the preview (§1.2): the light panel's
 * background is visibly light, the dark panel's is visibly dark, and that is
 * the whole light/dark rule. A user can set `--divider-color` to transparent
 * or the background to white, so a second, fixed outline in the *builder's*
 * own border color keeps the two panels visually separated even then
 * (§6.1 item 7) — that outline is the one piece of this component that is
 * deliberately not a theme variable.
 */
export function PreviewPanel({ mode, vars, className, children }: PreviewPanelProps) {
  return (
    <div
      data-preview-mode={mode}
      style={{
        ...vars,
        background: "var(--primary-background-color)",
        border: "1px solid var(--divider-color)",
        color: "var(--primary-text-color)",
        fontFamily: "var(--ha-font-family-body)",
      }}
      className={cn(
        "min-w-0 rounded-xl p-4 outline outline-1 -outline-offset-1 outline-border/40",
        className,
      )}
    >
      {children}
    </div>
  )
}
