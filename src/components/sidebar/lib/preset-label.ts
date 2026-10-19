const TAILWIND_SUFFIX = " (Tailwind)"

export function sidebarPresetLabel(label: string): string {
  return label.endsWith(TAILWIND_SUFFIX) ? label.slice(0, -TAILWIND_SUFFIX.length) : label
}
