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

/**
 * Turn a palette color name into a display label.
 *
 * Hyphens become spaces and the first letter goes upper case. The picker
 * swatches and the compare dialog read the same label.
 *
 * @example
 * paletteColorLabel("light-blue") // "Light blue"
 */
export function paletteColorLabel(name: string): string {
  const spaced = name.replace(/-/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}
