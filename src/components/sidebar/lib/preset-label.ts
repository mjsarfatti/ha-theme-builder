const TAILWIND_SUFFIX = " (Tailwind)"

/**
 * Strip the " (Tailwind)" suffix from a preset label.
 *
 * Narrow sidebar rows show the short label. The compare dialog shows the
 * full label.
 *
 * @example
 * sidebarPresetLabel("Slate (Tailwind)") // "Slate"
 */
export function sidebarPresetLabel(label: string): string {
  return label.endsWith(TAILWIND_SUFFIX) ? label.slice(0, -TAILWIND_SUFFIX.length) : label
}
