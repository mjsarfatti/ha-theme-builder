/**
 * The sidebar strips the `" (Tailwind)"` suffix eight of the ten neutral-ramp
 * presets carry in `preset.label` — a 300px row has no room for the
 * provenance eight times over (`docs/UX-SPEC.md` §3.3, O-8). The compare-all
 * dialog keeps `preset.label` verbatim. This is a display transform in the
 * UI layer only: the engine's own label, id and sort order are untouched.
 */
const TAILWIND_SUFFIX = " (Tailwind)"

export function sidebarPresetLabel(label: string): string {
  return label.endsWith(TAILWIND_SUFFIX) ? label.slice(0, -TAILWIND_SUFFIX.length) : label
}
