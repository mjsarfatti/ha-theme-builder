# HA Theme Builder — UX Spec (M2)

> Status: **for sign-off** · Author: Claude (M2) · Last updated: 2026-08-11
> Revalidated against the merged M1 engine (`src/engine/`) and the Base UI shadcn scaffold.
> Wireframe: [`docs/wireframe/index.html`](./wireframe/index.html) — open the file directly in a
> browser (no server, no build step). Deliberately low fidelity. It is a communication device, not
> a head start on production code. **Real data:** all ten neutral ramps and all eight extended
> palettes carry their real hex values from `.references/colors/`. To compare them is the decision
> that the wireframe exists to test. Everything else is a gray box. It is not wired to the theme
> engine — the preview panels do not recolor, and there is no real color math.
> Gates: **M3** (preview pane), **M4** (knob sidebar), and informs **M5** (applied demo) and **M6** (export).

This document is the single source of truth for the v1 UI. M3 and M4 implementers can build from
this document alone.

- **MUST** = an acceptance criterion. Not negotiable without a PM decision.
- ***Recommended*** = a suggested implementation route, not a mandate. You have latitude. If you
  pick differently, say so in the PR rather than changing it silently.
- ***Alternative considered*** = rejected on purpose. Do not silently adopt it.

Every library, component and API named here is **checked on 2026-08-11** against three sources:
the live registry, the upstream sources, and the merged engine. §6.4 lists what was checked.
Check it again before you build.

**Where this spec and `src/engine/` disagree, the engine wins.** Its API is frozen (CLAUDE.md).
This document was first drafted before the engine existed. Every default, id, label and ordering
below now comes from the source. If you find another gap, stop and ask the owner to clarify. Do
not resolve it yourself, and do not work around the engine.

---

## 0. The one-sentence design

**Turn a knob on the left, watch your Home Assistant dashboard change on the right — in light
and dark at once — then hit Export.**

Everything below serves that sentence. The three biggest decisions all fall out of it:

1. **The preview is read-only.** The artifact let you edit colors *inside* the preview
   (color inputs on swatches, ramp-link dropdowns, reset links). That is a second control
   surface competing with the sidebar. Cut entirely. One place to change things: the sidebar.
2. **The applied HA dashboard comes first, not last.** The artifact buries it at position 6.
   For a user who has never thought about design tokens, the dashboard *is* the answer to
   "does this look good". The token sections are the detail underneath it.
3. **Export is always one click away**, not a section at the bottom of a long scroll.

---

## 1. Layout

### 1.1 Frame

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APP BAR  HA Theme Builder    [Auto|Light|Dark]  [Reset to defaults] [Export]│  56px, fixed
├───────────────┬──────────────────────────────────────────────────────────┤
│ SIDEBAR       │ PREVIEW                                                  │
│ 340px fixed   │  Living room  ─────────────────────────────────────────  │
│ own scroll    │  ┌──────────────────┐  │  ┌──────────────────┐           │
│               │  │  light panel     │  │  │  dark panel      │           │
│ Typography    │  └──────────────────┘  │  └──────────────────┘           │
│ Brand &status │  Surfaces & dividers ────────────────────────────────── │
│ Base tone     │  ...                                                     │
│ Surfaces      │  Neutral ramp ──────────────── [ Both modes ] ─────────  │
│ HA colors     │  ┌───────────── full-width panel ────────────────────┐   │
│               │  └───────────────────────────────────────────────────┘   │
└───────────────┴──────────────────────────────────────────────────────────┘
```

- The **app bar** is fixed. It holds the product name, the **mode toggle** below, a
  **Reset to defaults** button (disabled until something changes), and the primary **Export
  theme** button.
- The **sidebar** is a fixed-width `<aside>` with its own scroll container. It never collapses
  on desktop and it is never behind an accordion (see §3.1).
- The **preview pane** is the only long scroll. It fills the remaining width.

**Do not use the shadcn `Sidebar` block.** It brings a provider, cookie persistence, a rail, and
collapsible state we do not need. Use a plain `<aside class="w-[340px] shrink-0 border-r">`
wrapping a `ScrollArea`. The Sheet-based mobile fallback (§1.5) is the only collapsing behavior.

**The app bar carries a light/dark/auto mode toggle, for the builder's own chrome only** (owner
decision, 2026-08-14). Three states, one `ToggleGroup` (`ToggleGroupItem` ×3), `SunIcon` /
`MonitorIcon` / `MoonIcon`, single-select, between the product name and **Reset to defaults**.

- **Auto** is the default. It follows the OS through `prefers-color-scheme`, and it updates live
  if the OS setting changes while the app stays open.
- **Light** and **Dark** pin the builder's own chrome to that mode, no matter what the OS says.
- The choice persists to `localStorage`, key `"ha-theme-builder:color-scheme"`, value `"auto" |
  "light" | "dark"`. A read on load restores it. A missing or unreadable key also means `"auto"`.

**This toggle MUST NOT touch the preview.** It changes the sidebar, the app bar and every
control's own light or dark rendering — shadcn's own theme, not `--ha-*` variables. The two
preview columns stay permanently light and dark, side by side, exactly as PLAN.md §3 decision 4
and CLAUDE.md already require: *"Light and dark previews show side by side, always. No mode
toggle."* **A separate control, a separate rule, a separate set of variables.** Do not read this
toggle's state anywhere inside a preview panel. The preview carries no mode state of its own, and
this section does not add one. §4.8 restates this distinction where the artifact's own toggle —
a different control, for the preview — is cut.

### 1.2 The light/dark rule

**Column 1 is always light. Column 2 is always dark.** No column label anywhere, sticky or not —
each panel's own background already states its mode: the light panel is visibly light, the dark
panel is visibly dark, side by side. Every section aligns to the same grid, so a reader learns
the rule once, from the first section, and it holds for the whole scroll.

The rule has exactly one exception, and it is a principled one:

| Section content | Rendering |
|---|---|
| Values that differ between modes | **Two panels**, light left / dark right |
| Values that are identical in both modes | **One full-width panel**, tagged `Both modes` |

The neutral ramp and the extended palette are mode-independent. The ramp emits the same eleven hex
values for light and dark, and the palette emits the same eighteen. Only what *consumes* them
changes. To render them twice is pure duplication, and it halves the width of the two sections
that need width most (11 and 18 swatches). So those two sections span the full preview width.

Each **panel** is a rounded container whose own background is that mode's
`--primary-background-color`, with a hairline border in that mode's `--divider-color`. The panel
frame is therefore itself part of the preview. Panels in a row are equal width and top-aligned.
They do **not** have to be equal height.

*Alternative considered:* two full-height page columns (all sections stacked inside a Light
column and a Dark column). Rejected. The columns lose vertical alignment as content heights
diverge. There is also nowhere to put a section title that belongs to both columns.

*Alternative considered:* diagonally split swatches, half light / half dark. Rejected — clever,
unreadable, and impossible for the applied demo.

### 1.3 Preview section order

1. **Living room** — the applied HA demo (M5)
2. **Surfaces & dividers**
3. **Text & type**
4. **Brand & status**
5. **Neutral ramp** *(full width, both modes)*
6. **Entity colors** — the extended palette *(full width, both modes)*

A section header is a small uppercase label, a hairline rule across the full preview width, and a
one-line description of what the section controls. No section is collapsible.

### 1.4 Where export lives

**Export is a `Sheet` sliding in from the right**, opened by the app bar's primary button.
It contains:

- **Theme name** — an `Input`, default **`My Theme`** (`DEFAULT_CONFIG.name`). It becomes the YAML
  key verbatim. `toYaml` does not slugify and HA accepts spaces, so the only rule is **not empty**.
  Do not add a slug regex — an earlier draft of this spec invented one the engine does not want.
- **`Tabs`** with two tabs (`TabsTrigger`s inside a `TabsList` — never directly in `Tabs`):
  - **YAML** — the generated theme in a `ScrollArea`'d `<pre>`, with **Copy** and **Download**
    buttons pinned above it. The downloaded file's name is the theme name, slugified, with a
    `.yaml` extension — `my-theme.yaml` for the default `My Theme`. That is a filesystem detail
    only, and it does not touch the YAML key inside the file, which stays exactly as typed, per
    the no-slug rule above. A user with several exported themes then gets several distinct
    filenames, not one `themes.yaml` that each export overwrites.
  - **Install** — numbered steps for a dedicated `themes` folder, not a paste into
    `configuration.yaml` (owner decision, 2026-08-14). Checked against Home Assistant's own
    documented convention: `home-assistant/home-assistant.io`'s `frontend` integration page
    (`source/_integrations/frontend.markdown`, "Theme configuration splitting" section) documents
    three ways to load a theme — inline in `configuration.yaml`, a single included file, or a
    folder of files merged with `!include_dir_merge_named`. This spec picks the folder. It is
    what the export step already produces, one file per theme, and a later export needs no
    second edit to `configuration.yaml`.

    1. Create a `themes` folder next to `configuration.yaml`, if one does not exist yet.
    2. Save the downloaded file into that folder. Its name does not need to match the theme name
       inside it.
    3. Under `frontend:` in `configuration.yaml`, add `themes: !include_dir_merge_named themes`
       — once, the first time only.
    4. The first time, restart Home Assistant. After that, a new file in the folder needs only
       the `frontend.reload_themes` action, not a restart.
    5. Open your profile page and pick the theme from the list.

    Plus the `extra_module_url` font-loading snippet **shown only when a non-system, non-Roboto
    font is selected** (PLAN §3). When all fonts are system or Roboto, that block is absent, not
    empty.

The sheet is ~560px wide, dismissible with Esc and the backdrop, and MUST carry a `SheetTitle`
(shadcn requires one for accessibility, and `sr-only` hides it visually). Copy fires a
toast — this is a **Base UI** project, so use shadcn's `toast` component
(`toast.add({ title: "Copied to clipboard" })`), **not** Sonner.

**The artifact's "Generated values" scroll section is cut.** One home for export, always reachable,
no scrolling to the bottom of a 4000px page to find it.

*Alternative considered:* keep a collapsed YAML block as the final preview section *and* the
sheet, or add a "12 variables changed" counter to the **Export theme** button as a trust signal.
The owner rejected both (§7, O-4). One home for export, and a plain button with no counter.

### 1.5 Responsive

Desktop-first. Breakpoints are on **available preview width**, not viewport, where noted.

| Viewport | Behavior |
|---|---|
| **≥ 1440px** | Sidebar 340px. Preview two columns. All swatch labels + hex visible. |
| **1280–1439px** | Sidebar 320px. Preview two columns. Unchanged otherwise. |
| **1024–1279px** | Sidebar 300px. Preview two columns. **Compact swatch mode**: per-step hex labels in the ramp and palette sections are hidden and moved to a `Tooltip` on hover/focus. |
| **768–1023px** | Sidebar undocks: app bar gains a **Design** button opening the sidebar in a left `Sheet`. Preview full width, still two columns. |
| **< 768px** | As above, plus preview columns **stack** — light panel above dark panel, each full width. No label here either, per §1.2 — the stacked panels stay just as self-evident as the side-by-side ones. Both modes stay visible at the same time. You scroll between them. |

The two-column preview MUST NOT produce a horizontal scrollbar at any width. Wide content
(the ramp strip, the palette grid) shrinks its swatches. Below ~28px per swatch it removes labels
per the compact rule above. It never overflows.

This is not a phone tool. It must not *break* below 768px, but nothing is optimized there.

---

## 2. Color picker

### 2.1 Which knobs get which control

There are nine color knobs and they are not the same kind of thing. One heavyweight popover for
all nine is uniform and wrong.

| Knob | Allowed values | Control |
|---|---|---|
| Primary color | any | **Popover picker** (§2.2) |
| Accent color | any | **Popover picker** |
| Error color | any | **Popover picker** |
| Warning color | any | **Popover picker** |
| Success color | any | **Popover picker** |
| Info color | any | **Popover picker** |
| Border color | one of five named steps | **Inline mini-card list** (§2.5) |
| Card background | neutral 80 / 90 / 95 / white | **Inline 4-swatch row** (§2.5) |
| Primary background | neutral 80 / 90 / 95 / white | **Inline 4-swatch row** |

The last three are *choices from a short fixed list*. A list of four options does not need a
popover, a saturation square, or a hex field. It needs four buttons. Inline in
the sidebar, they remove three popovers and make the constraint ("you can only pick from the ramp
here") visible instead of discoverable.

**No `<input type="color">` anywhere in the app.** Not as a fallback, not behind an opacity-0
overlay (which is what the artifact does). This is an acceptance criterion for M4.

*Alternative considered:* one uniform popover for all nine. Rejected. The owner settled on the
inline form (§7, O-1).

### 2.2 Popover anatomy

Trigger: a `Button` styled as a sidebar row —

```
┌───────────────────────────────────────────┐
│ ██  Primary color                #009ac7 ▾│   swatch 28px · label · hex, mono, muted
└───────────────────────────────────────────┘
```

The swatch is a rounded square filled with the current value, with a 1px inset ring so white and
near-white are still visible. The whole row is the trigger.

`Popover`, `align="start"`, `side="right"` on desktop (so it opens over the preview, not over
the sidebar's other knobs), 300px wide. Content, top to bottom:

```
┌── 300px ───────────────────────────────────┐
│ Primary color                              │  1. header
│ ██████  [ #009ac7          ]      [Reset]  │  2. big swatch + hex Input + reset
├────────────────────────────────────────────┤
│ FROM YOUR HOME ASSISTANT COLORS            │  3. extended palette, 18 hues
│ ● ● ● ● ● ● ● ● ●                          │     2 rows of 9
│ ● ● ● ● ● ● ● ● ●                          │
│                                            │
│ RECENT                                     │  4. last 8 committed custom colours
│ ● ● ● ● ● ● ● ●                            │
├────────────────────────────────────────────┤
│ PICK A COLOR                               │  5. free picker
│ ┌────────────────────────────────────────┐ │     saturation/value square, 160px tall
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │     hue slider
├────────────────────────────────────────────┤
│ ⚠ White text on this color fails contrast  │  6. conditional warning (§5.3)
└────────────────────────────────────────────┘
```

**The neutral ramp is not a swatch source here** (owner decision, 2026-08-14). An earlier draft
of this spec offered "From your base tone" as a second anchored group, alongside the entity
palette. Cut. The popover offers only the entity palette and Recent. Border color, Card
background and Primary background still pick from the neutral ramp directly (§2.5) — that part
is unchanged. This cut is about the six-knob popover only.

**Palette swatches come before the free picker, always.** That ordering is the whole point of
"palette-aware": the anchored choice is the default path, free picking is the escape hatch. A
user who wants the palette amber as the accent color reaches it in one tap. That user never sees
a color wheel.

*Alternative considered:* `Tabs` — "Palette" / "Custom". Rejected: it adds a mode, hides the
escape hatch behind a click, and saves 200px of popover height we can afford.

### 2.3 The swatch groups

**From your entity colors** — the eighteen hues of the *currently selected* extended
palette. Render them as 24px circles, in two rows of nine. The order is the canonical one (red,
pink, purple, deep-purple, indigo, blue, light-blue, cyan, teal, green, light-green, lime, yellow,
amber, orange, deep-orange, brown, blue-grey). Tooltip: `Amber · #ffc107`.

**This group MUST re-render when the entity-palette preset changes**, including while a popover
is open. This is the mechanism that makes the picker palette-aware. It is not decorative. The
base tone (neutral ramp) is no longer a swatch source in this popover (see §2.2), so changing it
has no effect on anything inside an open popover — only the entity-palette group re-renders.

*Recommended refinement:* keep the popover open when the user changes the entity-palette preset
in the sidebar behind it. That is the one moment where the user wants to watch the swatches
change. Base UI closes on outside press by default. Cancel that one case:

```tsx
<Popover
  open={open}
  onOpenChange={(next, details) => {
    if (
      !next &&
      details.reason === "outsidePress" &&
      (details.event.target as HTMLElement)?.closest("[data-preset-list]")
    ) {
      details.cancel()
      return
    }
    setOpen(next)
  }}
>
```

(`reason`, `event` and `cancel()` are all on Base UI's `ChangeEventDetails`. Checked, §6.4.)

If this proves fiddly, an acceptable fallback is to let the popover close. The user reopens it
and sees the new swatches. Do not spend a day on it.

**Recent** — up to eight most-recently-committed values from the free picker or hex field,
newest first, deduplicated, shared across all six popovers, and persisted across a reload (§2.6).
Hidden entirely when empty — no empty-state row.

**Selected state**: if the current value equals a swatch exactly (case-insensitive hex compare),
that swatch gets a 2px ring plus a check glyph, and `aria-checked="true"`.

### 2.4 Free picking, hex entry, keyboard

**Free picker** — *recommended*: `react-colorful`'s **`<HexColorPicker color={hex} onChange={fn} />`**.
That single component renders *both* the saturation/value square and the hue slider. It is not a
set of primitives that you compose. The package exports no saturation-only or hue-only component. Style
it by overriding the `.react-colorful*` class names (the package ships its own CSS-in-JS). Size it
with `.react-colorful { width: 100%; height: 190px }`. §6.4 has the checked details.

The library supplies the keyboard support and the accessibility. Each area is `tabIndex=0`, `role="slider"`, moves in 5%
steps on arrow keys, and carries an `aria-valuetext` (`"Saturation 42%, Brightness 88%"`). **Its
`aria-label` is a hardcoded, non-overridable `"Color"`** — so wrap the picker in a
`<div role="group" aria-label="Pick a custom color">` to give it context. Do not reimplement this
on a canvas.

**Hex field** — an `Input` in the header, `font-mono`.
*Recommended*: a plain shadcn `Input` with our own parsing, **not** react-colorful's
`HexColorInput`. `HexColorInput` accepts 3-digit and 6-digit hex. But it commits on every
keystroke as soon as the value is valid, and it has no error state. That is the opposite of the
behavior below. If an implementer prefers `HexColorInput`, the commit-on-Enter/blur and error-state
rules below are what they lose. Raise it rather than silently changing the behavior.
- Accepts `#abc`, `abc`, `#aabbcc`, `aabbcc`, any case.
- Commits on `Enter` and on blur. Does **not** commit per keystroke, because a commit per
  keystroke fires the engine on every character.
- Invalid input: field turns destructive, an inline message reads `Enter a 3 or 6 digit hex color`,
  the committed value is unchanged. `Escape` reverts the field to the committed value.
- Dragging the saturation square updates the field live.

**Reset** — restores this knob's value from `DEFAULT_CONFIG`. Visible only when it differs.

**Keyboard and a11y — MUST:**

| | |
|---|---|
| Trigger | `<button>`, `aria-haspopup="dialog"`, `aria-expanded`, accessible name `"Primary color, currently #009ac7"` |
| Open | `Enter` / `Space`. Base UI moves focus into the popover. Focus lands on the hex `Input`. |
| Close | `Escape` closes and returns focus to the trigger. Click-outside closes and commits. |
| Between groups | `Tab` moves group to group: hex → palette grid → recent → saturation → hue. |
| Within a group | **Roving tabindex.** One swatch per group is in the tab order. `←`/`→` (and `↑`/`↓` in the palette grid) move the roving focus and, per WAI-ARIA radiogroup semantics, select as they move. `Home`/`End` jump to first/last. |
| Group semantics | `role="radiogroup"` with `aria-label` on each group. Swatches are `role="radio"`. |
| Swatch names | `aria-label="Amber, #ffc107"` — never color alone. |
| Live region | The header hex value is in an `aria-live="polite"` region so screen readers hear changes made by dragging. Debounce announcements to 300ms. |
| Focus ring | Visible on every swatch, at 2px, offset outward, in the *builder's* focus color. Never a theme color, because the user can set a theme color to something invisible. |
| Contrast | Every swatch carries a 1px inset ring at 12% ink so white/near-white swatches remain visible on a white popover. |

Reduced motion: the popover's open animation respects `prefers-reduced-motion` (shadcn default).

### 2.5 The inline pickers

**Border color, redesigned (owner decision, 2026-08-14).** The 11-segment strip this spec first
proposed rendered a color chip at 12% alpha for every slot. Against a light card, eleven near-black
colors at 12% alpha all read as near-identical light greys — the strip does not let a user tell the
steps apart. It also hides that the pick drives two other variables, not only the divider line:
`--outline-hover-color` at `3d` alpha and `--shadow-color` at `29` light / `7a` dark
(`derive.ts:444-453`). A color chip cannot show either of those. **The control now renders the
outcome, not the ingredient.**

**Five named steps, not eleven raw slots:**

| Step | Config value | What it resolves to |
|---|---|---|
| Invisible | `"match-card"` *(new — §2.7, engine-blocked)* | The card surface itself. The border disappears into the card. |
| Hairline | `"neutral-80"` | The faintest step a user can still see. |
| Subtle | `"neutral-60"` | |
| Medium | `"neutral-30"` | |
| Strong | `"neutral-05"` — the default, unchanged from this spec's earlier draft | The darkest of the four. |

Hairline through Strong run progressively **darker** than the card surface, in that order. This
part needs no engine change. `borderColor` stays a plain `NeutralSlotId` for these four values —
it is a UI restriction on top of the existing eleven-value union, the same kind of restriction the
font dropdown already applies to `FONTS`. It does not touch the engine's own list.

**Why these four slots, and not four others.** I did not pick these from memory. I rendered all
eleven slots — the KNOB's own light-mode semantics, with the engine's real `mirrorSlot` applied
for the dark-mode render — at `1f` alpha over every `SurfaceChoice`, in both modes, on the default
`ha` ramp and on a tinted ramp (`mauve`, to check a tint does not break the ladder). The numbers
below are the composited result against the default card (`white`), on the `ha` ramp:

| Slot | Light, composited over `#ffffff` | Dark, composited over `#202020` |
|---|---|---|
| neutral-05 (**Strong**) | `#e2e2e2` | `#3a3a3a` |
| neutral-10 | `#e4e4e4` | `#383838` |
| neutral-20 | `#e7e7e7` | `#353535` |
| neutral-30 (**Medium**) | `#e9e9e9` | `#323232` |
| neutral-40 | `#ebebeb` | `#2f2f2f` |
| neutral-50 | `#efefef` | `#2b2b2b` |
| neutral-60 (**Subtle**) | `#f2f2f2` | `#282828` |
| neutral-70 | `#f6f6f6` | `#252525` |
| neutral-80 (**Hairline**) | `#f9f9f9` | `#232323` |
| neutral-90 | `#fcfcfc` | `#202020` |
| neutral-95 | `#fefefe` | `#1f1f1f` |

Two things follow from this table. First, the eleven raw slots really do bunch up towards the light
end — `neutral-80` through `neutral-95` composite within two or three points of each other and of
the card. This confirms the flag. Four slots spread across the full range, rather than four
adjacent ones, keep each step visually distinct. Second, **`neutral-90` is disqualified, not just
skipped.** At the default card (`white`) in dark mode, `neutral-90`'s mirrored render slot is
`neutral-10`, which composites to `#202020` — the *exact* hex of the dark card background. That
is an accidental full match, not the deliberate Invisible step, and it happens on the single most
common configuration a user sees (`DEFAULT_CONFIG.cardBackground` is `"white"`). No other slot in
the four I picked produces an exact collision on any of the four `SurfaceChoice` values, in either
mode, on either ramp I checked.

The ladder holds as a ladder under both checks the owner asked for: it stays monotonic in dark
mode, where the render slot mirrors (`neutral-05` always renders as the *lightest* dark-mode
slot and still reads as the strongest step, because a light border on a dark card and a dark
border on a light card carry the same *strength*), and it stays monotonic on a tinted ramp
(`mauve`'s four picks composite to `#e3e2e3 / #eae8ea / #f3f2f3 / #f9f8f9` in light, `#3e373f /
#372f38 / #2d242e / #282029` in dark — same spread, same order, tinted instead of grey).

**The mini-card.** Each of the five options renders as a small card, not a color chip: that
option's real card background, a real `1px` border at the step's alpha, and a real shadow under
it. This is possible without any precomputed blend — a CSS border with an alpha color, painted
over a background of the actual card color, is composited by the browser itself, so what renders
already **is** the on-card result. The sidebar is mode-agnostic everywhere else, but this knob
reads in opposite directions per mode (`derive.ts:445` mirrors the slot in dark), so each mini-card
splits diagonally: the light render on the upper-left triangle, the dark render on the lower-right,
both visible at once. Implementation: two full-size cards stacked, the lower one a plain
rectangle for the light half, the upper one identical but clipped to a lower-right triangle
(`clip-path: polygon(100% 0, 100% 100%, 0 100%)`) for the dark half — each with its own
background, border and shadow, so the shadow clips at the same diagonal as the card it belongs
to. That is not a defect. It reinforces which half a reader looks at.

*Alternative considered:* a single swatch per step, split diagonally with no border or shadow
drawn (the original proposal, a color chip cut in half). Rejected in favor of the mini-card
because a flat diagonal swatch repeats the exact problem this redesign exists to fix — a color
sample, not the outcome.

**Layout:** a vertical list, one row per step, in the same geometry the ramp and palette preset
lists already use (§3.3) — a radio dot, the step's label at a fixed width, then the mini-card at
around 150×34px. `role="radiogroup"`, one tab stop, roving tabindex, arrow keys move and select,
exactly like every other swatch group (§2.4's keyboard table applies here too). Selected state
gets the same ring-plus-fill the preset lists use. Each row's accessible name states both
composited hexes so the choice is not conveyed by color alone: `"Strong: light #141414, dark
#f3f3f3, rendered at 12% opacity"`, or `"Invisible: matches the card surface in both modes"` for
that one step. A helper line under the group states the split once, since it is a new pattern:
*"Each option is a small card: real background, real border, real shadow. Light half top-left,
dark half bottom-right."*

**Card background / Primary background** — a four-button row: `Neutral 80`, `Neutral 90`,
`Neutral 95`, `White`. Each button is a swatch above a two-line label. Selected state gets a ring
and a check. Helper text under both: *"Dark mode uses the matching dark shade automatically."*

### 2.6 Recent colors persist across a reload

Settled with the owner (§7, O-7). This reverses this spec's earlier recommendation. Recent colors
survive a reload. Each entry carries its own age. The picker drops a stale entry on read. It does
not clear the whole list at once.

- **Storage:** `window.localStorage`, key `"ha-theme-builder:recent-colors"`.
- **Entry shape:** `{ hex: Hex; lastUsedAt: number }`. `lastUsedAt` is `Date.now()` at the moment
  of the commit, in epoch milliseconds.
- **Value:** a JSON array of entries, newest first, capped at 8 — the same cap §2.3 already sets
  for the popover's Recent row.
- **Staleness is per entry, not per list.** The staleness period is 7 days
  (`7 * 24 * 60 * 60 * 1000` milliseconds). A read drops every entry whose `lastUsedAt` is older
  than 7 days from the current time, then writes the filtered list back to `localStorage`. A read
  happens at app load and at every popover open, so a stale entry never survives past the next
  time a user looks at the list.
- **What writes an entry.** Only a hex committed from the free picker or the hex field writes or
  refreshes an entry — the same rule §2.3 already sets for what counts as "recent". A pick from
  the ramp strip, the palette grid or the Recent row itself does not write an entry, because that
  value already has a home in a group the user can already see.
- **On write:** compare the new hex against existing entries, case-insensitive. A match moves to
  the front and gets a fresh `lastUsedAt`. No match prepends a new entry. Either way, trim the
  list to 8 after the write.
- **`localStorage` can fail** — private mode, a full quota, a disabled store. A failed read or
  write MUST NOT throw. The picker then uses the session-only behavior this spec's earlier draft
  already describes. Recent still works for the rest of the session. It does not survive the next
  reload.

### 2.7 Blocked on an engine change

Two separate decisions this round both need a change to `src/engine/`, and that API is frozen
(CLAUDE.md, PLAN §5). Both ride the same future engine work package — one PM decision unfreezes
the API once, for both, rather than twice. This section specifies both precisely enough for that
package to build. **Neither is buildable in M3 or M4.** The build notes in §6.2 restate this.

#### Change 1 — palette-relative colors (O-3)

Settled with the owner (§7, O-3), reversed from this spec's earlier recommendation. **A color
picked from an entity-palette swatch follows that preset when the preset changes.** A color typed
or picked as a free custom value does not follow anything — it stores a literal hex, same as
today.

**Narrower than the round this was first specified in.** O-3 originally covered a color picked
from *either* the neutral ramp or the entity palette. A later review comment cut the neutral ramp
as a swatch source from the six-knob popover entirely (§2.2). A brand or status color can now
reach the picker only through the entity palette, the free picker, or the hex field, so the
"follows a preset" behavior below has only one preset left to follow.

M3 and M4 MUST NOT build "follows a preset" now. `ThemeConfig.colors.*` is `Hex` today, and a
literal hex has no identity to follow. A config shape the engine does not yet ship is not
buildable this milestone. Build the picker exactly as §2.2–§2.5 already specify: every swatch pick
commits a literal hex.

**1. Behavior.** A swatch picked from the active entity palette stores which hue it came from, not
just its color. When the user later changes the entity palette, that knob re-resolves to the same
hue in the new palette and its color changes with it. A color a user types, or picks by drag on
the saturation square, stores a literal hex, and it never moves again.

**2. Proposed config shape** — a recommendation to the engine package, not a settled fact. Keep
each value a plain string, so `ThemeConfig` stays JSON round-trippable. A value is one of two
things: a `#rrggbb` literal, or a palette reference — this spec proposes
`` `palette:${PaletteColorName}` `` (`"palette:red"`). That reuses the existing
`PaletteColorName` union. It does not need a new one:

```ts
type PaletteRef = `palette:${PaletteColorName}`
type SeedColor = Hex | PaletteRef
```

**`NeutralSlotId` is deliberately not a member.** An earlier draft of this section included it,
from when a brand or status color still had a neutral-ramp swatch to pick, too. Checked against
the current spec rather than assumed: with that swatch group cut (§2.2), nothing in the picker can
produce a `colors.*` value that needs to reference a neutral slot, and no other control writes to
`colors.*` either. If a future round reopens the neutral ramp as a swatch source for these six
knobs, add `NeutralSlotId` back then, not before.

`colors.primary`, `colors.accent`, `colors.error`, `colors.warning`, `colors.success` and
`colors.info` change type from `Hex` to `SeedColor`. `resolveConfig()` and `derive()` resolve a
reference against the config's own `palette` field before any ramp math runs.

**3. The constraint that stops a cycle.** A reference MUST point only at the entity palette. It
MUST NOT point at a generated ramp: primary, red, orange or green. The engine generates those
four ramps from these same seed knobs. A reference into one of them has no fixed point to resolve
to. The engine cannot generate the ramp until it resolves the seed, and it cannot resolve the seed
until it has the ramp. This is a hard rule, not a style preference.

#### Change 2 — border color's Invisible step, and the shadow fix it needs

Settled with the owner (§7, Border color redesign — a second round of feedback, separate from
O-1 to O-8 but blocked by the same kind of engine change as O-3, hence the same section).
§2.5 names the step **Invisible**: the border resolves to the card surface itself, so it
disappears into the card. `borderColor` is `NeutralSlotId` today, and `"white"` — a legal
`cardBackground` — is not a member of that union. So `borderColor` cannot express "match the card
surface" under the current type. This needs a second change to `ThemeConfig`, in the same work
package as Change 1.

**1. Proposed config shape.** Add one sentinel value to the union:

```ts
type BorderColor = NeutralSlotId | "match-card"
```

`"match-card"` names the resolution mechanism, not the visual effect — the UI label **"Invisible"**
already carries the effect, so the code-level value stays literal about what it does. Alternatives
considered and rejected: `"invisible"` (names an effect the value does not by itself produce — a
`"match-card"` border is still a real, painted border, just one that composites away) and
`"card"` alone (reads as a card *reference*, not a *match*). `"match-card"` states plainly that
the value points at another field. It is not a color in its own right.

**2. Resolution — read this carefully, it is the part most likely to be built wrong.**
`"match-card"` MUST resolve to the literal, already-computed `card-background-color` for the
current mode, not to a ramp lookup and not through `mirrorSlot()`. Two facts force this:

- `"white"` has no `NeutralSlotId`, so there is no slot for `mirrorSlot()` to invert in the first
  place.
- Dark-mode card placement is not a mirror of the light slot. `surfaces()` (`derive.ts:163-192`)
  computes it from an elevation-preserving formula (`darkCard = darkPage + elevation`) that keeps
  the *gap* between card and page, not the card's own position. A concrete case proves the two
  approaches diverge: `cardBackground: "neutral-90"`, `primaryBackground: "neutral-95"` (both
  legal, neither the default) computes a dark card at `neutral-05` today. A naive `mirrorSlot`
  read of the light choice, `mirrorSlot(90)`, gives `neutral-10` instead — a different hex. Built
  the naive way, Invisible shows a faint but real line in dark mode, on this and other ordinary
  configs, not only in the "white" edge case.

The correct implementation reuses the per-mode `surface.card` value `derive()` already computes
for `card-background-color`, the same value §2.5's mini-card reads to render the composite. It
does not add a second, parallel way to compute a card color.

**3. Fact check — "Invisible needs no opacity change" (confirmed).** 12% of the card color,
composited over the card background, equals the card background exactly — an algebraic identity
(`α·C + (1−α)·C = C`) that holds regardless of `α`, so it needs no special-case in `withAlpha` or
the `1f` constant `template.css:145` sets. I checked this against the engine directly, for all
four `SurfaceChoice` values in both modes: `derive()`'s output, composited by hand, lands back on
its own card hex every time, exactly.

**4. Fact check — "Invisible breaks the shadow" (confirmed, and already true today).** The coupling
is not new. `derive.ts:444` computes one `lightBorderBase` from `config.borderColor`, and
`derive.ts:453` hands that *same* base to `--shadow-color`: `withAlpha(lightBorderBase, dark ?
"7a" : "29")`. I checked this live. `derive({ borderColor: "neutral-05" })` gives `shadow-color:
#14141429`. `derive({ borderColor: "neutral-95" })` gives `#f3f3f329`. The shadow already moves
with the border knob today, for any of the eleven slots, with no Invisible step involved. Once
`borderColor` can resolve to the card surface, this coupling turns a merely pale shadow into an
exactly-invisible one: card-surface-on-card-surface, alpha or no alpha. A borderless card with a
shadow is the entire point of the Invisible step, so the shadow MUST survive it.

**Requirement:** `--shadow-color` MUST always derive from `neutral-05`, independent of
`borderColor`'s value, and independent of mode too — the same rule `derive.ts:449-452` already
applies on the mode axis. Only the alpha changes (`29` light, `7a` dark). Concretely,
`derive.ts:453` no longer takes its base from `lightBorderBase`. It takes a fixed `neutral[5]`
instead. Divider, outline and outline-hover still take the border knob's own base exactly as they
do today. Only the shadow line changes.

**Where the NOTE sits, checked.** `template.css:144`'s comment — `Lines -> NOTE: Derive using
--ha-color-neutral-05 as base in place of "000000"` — sits directly above the whole Lines block,
`template.css:145-148`: divider, outline, outline-hover and shadow together, not the divider line
alone. That reading is right. One note for the engine package, not a change to the decision above:
`template.css:148`'s own per-line comment on `--shadow-color` reads `DERIVED: --divider-color RGB
+ "29" opacity` — which names the *border knob's* base, not a fixed `neutral-05`, and is what
`derive.ts` currently implements. The block NOTE and the per-line comment point in different
directions. The fix above resolves the conflict in favor of the block NOTE, per the owner's
decision. Only one of the two comments stays true in the file after this change, and the engine
package must know both exist before it picks which one to follow.

---

## 3. Knob sidebar IA

### 3.1 Structure

Five groups, **all permanently open**, in one scroll. Group headings are sticky within the
sidebar scroll container (small uppercase, muted, with a `Separator` above).

*Alternative considered:* an `Accordion` with one group open at a time. Rejected. It hides 12
of the 15 knobs behind a click. Worse, it hides the fact that a change of base tone also moves the
surfaces. A ~1300px sidebar scroll is acceptable on a desktop tool.

### 3.2 Groups, order, controls

Labels in `code` are verbatim from `template.css` and MUST be used as-is.

---

**1 · Typography**

| Label | Control | Writes | Default (`DEFAULT_CONFIG.fonts`) | At load |
|---|---|---|---|---|
| `Body font family` | Grouped `Select` | `fonts.body` | `"roboto"` | Visible |
| `Headings font family` | Grouped `Select` | `fonts.heading` | `"roboto"` | Under **More** |
| `Longform font family` | Grouped `Select` | `fonts.longform` | `"system-sans"` | Under **More** |
| `Code font family` | Grouped `Select` | `fonts.code` | `"system-mono"` | Under **More** |

Order within the group is **Body, Headings, Longform, Code** — most-used first — which differs
from `template.css`'s declaration order. Labels are unchanged.

**Progressive disclosure (owner decision, §7, O-6).** At load, only **Body font family** shows.
The other three sit behind a **More** control. Most users only care about the body font — the
other three are a small group's concern, and the owner made this call directly rather than as a
recommendation.

Use the shadcn `collapsible` component: `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent`,
from `@base-ui/react/collapsible`, present in the `base-nova` registry and checked 2026-08-14
(§6.4). This is not the `Accordion` §3.1 rejects for the whole sidebar. §3.1 rejects an accordion
because it hides 12 of 15 knobs and hides a cross-knob relationship the user needs to see. This is
one knob group's own extra rows, closed by default, with no relationship to the rest of the
sidebar. One `Collapsible`, one trigger, and no other section to open or close in step with it.

Anatomy:

- `CollapsibleTrigger` sits directly under the Body font row, styled as a small text `Button`,
  `variant="ghost"`. Label reads **"More"** when closed and **"Less"** when open. A
  `ChevronDownIcon` at `data-icon="inline-end"` turns 180 degrees on open, driven by the
  component's own `data-state` attribute — no extra state to track by hand.
- `CollapsibleContent` holds Headings, Longform and Code, each with its own row, label and help
  text, unchanged from the table above.
- The group loads **closed**. The app always starts at `DEFAULT_CONFIG` (§5.1), so there is no
  saved open state to restore in v1.
- `Tab` reaches the trigger in row order. `Enter` and `Space` toggle it, per Base UI's default
  `Collapsible` keyboard behavior. A closed group takes Headings, Longform and Code out of the tab
  order for free. Base UI hides a closed panel's content from the accessibility tree by default.
  This needs no extra `tabIndex` work.
- The open and close motion respects `prefers-reduced-motion`, the same rule as the popover
  (§2.2).

All four dropdowns share **one identical list**, built from the engine's `FONTS` array grouped by
`FontOption.category`, with `FONT_CATEGORY_LABELS` supplying the group headings. **Do not hardcode
the list or the group names.** The engine owns both. The key order of `FONT_CATEGORY_LABELS` is
the order of the groups in the dropdown:

| Group heading | Items (`FONTS`, in array order) |
|---|---|
| **Sans-serif** | Roboto, Inter, Figtree, DM Sans, Nunito Sans, Manrope, Outfit, Rubik |
| **Serif** | Source Serif 4, Lora, Merriweather, Bitter |
| **Display serif** | Fraunces, Playfair Display |
| **Monospace** | JetBrains Mono, IBM Plex Mono |
| **System** | System sans, System serif, System mono |

19 items. Note **System is last, not first** — an earlier draft of this spec had it first and the
group headings shortened ("Sans", "Mono"). The engine's order and wording win. Every `SelectItem`
and `SelectLabel` MUST sit inside a `SelectGroup`, never directly in `SelectContent` (shadcn
composition rule).

**Each `SelectItem` MUST be rendered in its own typeface** at ~15px. That is the entire preview for
this knob and it is worth loading the sixteen webfonts into the builder to get. The set to load is
exactly `FONTS.filter(f => f.needsWebfont)`. Load them from Google Fonts at 400/500/700 with
`display=swap` in the builder's own `index.html`. Builder-side only, unrelated to the exported
theme — that ships its own `extra_module_url` snippet driven by `theme.webfonts` (§1.4).

Each knob carries one line of helper text, because "longform" means nothing to a HA user:

- Body font family — *Most of the UI: labels, buttons, entity names.*
- Headings font family — *Card and section titles.*
- Longform font family — *Long blocks of text, like a markdown card.*
- Code font family — *Code and YAML, like the template editor.*

---

**2 · Brand & status colors** — six popover pickers (§2.2), in this order:

| Label | Config field | Seeds | Default |
|---|---|---|---|
| `Primary color` | `colors.primary` | `--ha-color-primary-40` | `#009ac7` |
| `Accent color` | `colors.accent` | `--accent-color` (standalone) | `#ff9800` |
| `Error color` | `colors.error` | `--ha-color-red-50` | `#dc3146` |
| `Warning color` | `colors.warning` | `--ha-color-orange-70` | `#ff9342` |
| `Success color` | `colors.success` | `--ha-color-green-60` | `#00ac49` |
| `Info color` | `colors.info` | `--info-color` (standalone) | `#039be5` |

Group helper text: *"Each of these seeds a full ramp. You pick one shade. The rest are generated."*
True for primary/error/warning/success. Accent and info are standalone values with no ramp.

---

**3 · Base tone** — the neutral ramp preset picker. `Label: "Base tone"`.
Config field `neutralRamp: NeutralRampId`, default `"ha"`. Options are `NEUTRAL_RAMPS` (§3.3).

Group helper text: *"Every background, border and text color comes from this ramp."*

---

**4 · Surfaces** — the three constrained knobs (§2.5), in this order:

| Label | Config field | Control | Default |
|---|---|---|---|
| `Card background` | `cardBackground: SurfaceChoice` | 4-swatch row | `"white"` |
| `Primary background` | `primaryBackground: SurfaceChoice` | 4-swatch row | `"neutral-95"` |
| `Border color` | `borderColor: NeutralSlotId` | mini-card list, 5 named steps (§2.5) | **`"neutral-05"`** — the **Strong** step |

`SurfaceChoice` is exactly `"white" | "neutral-95" | "neutral-90" | "neutral-80"`. `NeutralSlotId`
is `"neutral-05"` … `"neutral-95"` (11 values). Both come from `src/engine/types.ts` — the control
options for Card background and Primary background are the union members, not a hand-written
list. Border color's five named steps are a UI-only subset of the same union, plus one sentinel
value — see §2.5 for the four slots and §2.7 for the sentinel.

The border default is the **darkest** of the four named slots, not a light one. `--divider-color`
is `neutral-05` at `1f` alpha. That is how `template.css` gives its `#0000001f` a tint from the
ramp. An earlier draft of this spec and the wireframe both had it defaulting to `neutral-80`.
Wrong. Under the redesign this is the **Strong** step, still the default, still the same slot.

---

**5 · Entity colors** — the extended palette preset picker.
`Label: "Entity colors"`. `template.css` writes `"Home Assistant colors"` — the owner relabeled
the knob for clarity (§7, O-2). `EXTENDED_PALETTES` and the CSS variables the knob feeds keep
their existing names. Only the sidebar label changed.
Config field `palette: ExtendedPaletteId`, default `"ha"`. Options are `EXTENDED_PALETTES` (§3.3).

Group helper text: *"These color entity icons and badges — a light is amber, a lock is red."*

---

**Ordering rationale.** Fonts first: the fastest visible change, zero risk, and it matches
`template.css`. Brand colors second: the single thing most users came here to change. Then the
neutral system and the surfaces built on it, adjacent so their interaction is visible. The
extended palette last: eighteen values that only affect entity icon colors — the longest tail.

### 3.3 Comparing ~10 ramps and ~8 palettes

A dropdown of names ("Zinc", "Stone", "Mauve") tells the user nothing. Both preset pickers use
the same pattern:

**A vertical list of named color strips, one row per preset, radio semantics.**

```
┌────────────────────────────────────────┐
│ ● Home Assistant                       │
│   ▐▐▐▐▐▐▐▐▐▐▐                          │   11 steps, dark→light, full row width
├────────────────────────────────────────┤
│ ○ Slate                                │
│   ▐▐▐▐▐▐▐▐▐▐▐                          │
├────────────────────────────────────────┤
│ ○ Stone                                │
│   ▐▐▐▐▐▐▐▐▐▐▐                          │
└────────────────────────────────────────┘
      … 10 rows, ~34px each ≈ 340px
```

The strip is the label. The comparison is the stack itself: all ten strips at identical width,
aligned on the same step boundaries. The warm cast of Stone against the blue cast of Slate is
then visible at a glance. No name and no single swatch can give the reader that. The extended palette picker
is the same component with eighteen segments per row and eight rows.

**Both lists are rendered from engine data, in engine array order, using engine labels.** Do not
hardcode names or reorder for aesthetics:

| Picker | Source | Order (ids) |
|---|---|---|
| Base tone | `NEUTRAL_RAMPS` → `.ramp`, 11 slots via `rampEntries` | `ha`, `rounded`, `slate`, `gray`, `zinc`, `stone`, `mauve`, `olive`, `mist`, `taupe` |
| Entity colors | `EXTENDED_PALETTES` → `.colors`, keyed by `PALETTE_COLOR_NAMES` | `ha`, `tailwind-v3`, `tailwind-v4`, `material-accent`, `ant-design`, `chakra-ui`, `bulma`, `rounded` |

`preset.label` for the eight Tailwind-derived ramps carries a suffix, for example
**"Stone (Tailwind)"**. **The sidebar list strips the suffix** — it renders "Stone", not
"Stone (Tailwind)" — because a 300px row does not need the provenance eight times over. **The
compare-all dialog keeps the full `preset.label`**, suffix included, since that view is the
place for it. Strip only the pattern `" (Tailwind)"` at the end of the label. Do not touch
`preset.label` itself, the ids, or the sort order — this is a display transform in the UI layer
only, decided at the owner's call (§7, O-8). The engine's label stays as it is. Ramp swatch order
is `rampEntries()`: slots 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, dark to light. There are no
black or white endpoints. Palette swatch order is `PALETTE_COLOR_NAMES`. Palette labels carry no
such suffix and stay untouched.

Implementation: `RadioGroup` / `RadioGroupItem` with the visual indicator suppressed and the strip
rendered as the `Label` content. Selected row: 2px ring in the builder's accent + a filled radio
dot. Full keyboard support comes free from Base UI (`↑`/`↓` moves and selects).

**Plus a "Compare all" escape hatch.** A text button under each list opens a `Dialog` at ~1100px.
That dialog needs a real `DialogTitle`, and `sr-only` hides it visually. It holds the
reference-table view: rows are steps and columns are presets, exactly as in
`.references/colors/*.html`. A click on a column header selects that preset and closes the dialog.
This costs almost nothing (the data is already there) and serves the user who wants to read
individual hexes rather than eyeball strips.

*Alternative considered:* a `Select` whose items each contain a mini strip. Rejected — you can
only see one at a time when it is closed, and closing the menu is exactly when you want to compare.

*Alternative considered:* showing the strips inside a themed preview surface so they sit on the
user's own background. Rejected. The presets are raw color data. The honest comparison renders
them on the neutral surface of the builder.

---

## 4. Preview content audit

The verdict on the artifact was "directionally right, a bit too detailed". Concretely, the detail
is of three kinds, and all three go:

- **Editing controls inside the preview** (`<input type="color">` on swatches, ramp-link
  `<select>`s, "reset" links). **Cut everywhere.** The sidebar is the only control surface.
- **RGB tuples under every swatch.** **Cut everywhere.** The engine omits `rgb-*` companions from
  the YAML where HA auto-derives them from hex (PLAN M1). A number that nobody copies and that
  nothing exports is noise.
- **CSS variable names under every swatch.** **Cut everywhere.** Surfaces and Text lose them too —
  an earlier draft of this spec kept them there. The owner's call (§7.1): the preview shows the
  rendered result, not the identifier. §4.1 and §4.2 name the variable each tile stands for once,
  in prose. Neither section restates it on every tile.

### 4.1 Surfaces & dividers — **keep, trimmed**

| Artifact | Verdict |
|---|---|
| 4 tiles, 200px, each with its surface color | **Keep** — tiles at 180px, 2×2 within each panel |
| Label + `--var-name` | **Keep the label. Cut the variable name.** |
| `hex · rgb` | **Trim** to hex only |
| Ramp-link `<select>` | **Cut** |
| `reset` link | **Cut** |
| 2px offset outline ring on each tile | **Cut** — decorative. A 1px hairline border in `--divider-color` is enough and is itself a token being previewed |

The four tiles are `--primary-background-color`, `--card-background-color`,
`--secondary-background-color`, `--divider-color`. The divider tile MUST render as a *card with a
hairline rule across it*, not as a solid fill. A solid block of a 12%-alpha value misleads the
reader about what the knob does.

### 4.2 Text → **rename "Text & type", keep + one addition**

| Artifact | Verdict |
|---|---|
| 3 × "The quick brown fox" in primary / secondary / disabled | **Keep** |
| `--var-name` | **Cut** |
| `hex · rgb` | **Trim** to hex |
| Ramp-link `<select>`, `reset` | **Cut** |

**Font preview, corrected.** An earlier draft of this spec said the four font knobs have no
preview anywhere. The owner's read is right: that overstates it (§7.1). The **Body**
font already renders in the "Living room" applied demo (§4.6) — entity names, labels and buttons
in a Home Assistant dashboard all take `--ha-font-family-body`. Body has two preview surfaces, not
zero.

**Heading, Longform and Code have no preview surface outside a dedicated specimen.** A check of
every preview section, the "Living room" demo and its M5 second card included, found no text that
takes `--ha-font-family-longform` or `--ha-font-family-code`. Neither section holds a long text
block or a code string. Heading looked like a candidate — the "Living room" room header reads like
a card title — but it is not one. Home Assistant's own `ha-card` sets `.card-header` to
`font-family: var(--ha-card-header-font-family, inherit)` (`ha-card.ts:43`). Neither `template.css`
nor the engine sets `--ha-card-header-font-family`. The header's font-family then resolves to
`inherit` — the ambient body font, not the heading knob. HA's own rule that binds an `<h1>` to
`--ha-font-family-heading` (`resources/styles.ts:52`) sits in a stylesheet outside `ha-card`'s
shadow root, so it never reaches the header either. A mock card header in this app can render in
the heading font. Nothing in §4.6 does so today.

So the type specimen below is not an extra next to knobs the demo already covers. **It is the
only preview surface for Headings, Longform and Code.** Extend this section with a short type
specimen inside the same card:

- a heading line in `--ha-font-family-heading`
- a sentence in `--ha-font-family-body`
- a two-line paragraph in `--ha-font-family-longform`
- a single code line in `--ha-font-family-code` (for example, `sensor.living_room_temperature`)

Each labeled with its role in small muted text. This is the only place the spec *adds* to the
artifact, and it closes the real gap — three knobs, not four.

### 4.3 Brand & status — **keep, restructured**

| Artifact | Verdict |
|---|---|
| 6 pills: color circle, label, var name, hex | **Keep the set of six** |
| The color circle being an `<input type="color">` | **Cut** — this is the artifact's core mistake |
| `reset` link, rgb tuple | **Cut** |

**Restructure**: render each as a **filled chip**. The color is the background, and the label is
rendered on it in `--text-primary-color`. The single most important derived value in this whole system is
"is text on the primary color legible", and rendering it makes the answer visible instead of
reported. Hex sits below the chip in muted mono.

A small warning glyph appears on any chip whose label fails **4.5:1** contrast, with a `Tooltip`
naming the ratio. Compute it with the engine's own `contrastRatio` — do not write your own.
Non-blocking (§5.3).

**There are two thresholds. Do not confuse them.** The engine picks *which* text color goes on a
brand color with `contrastingText()`. That threshold is **6**, because 6 is what HA uses. See
`derive.ts` and the engine README. The analysis doc §7.5 says 4.5 and is wrong. Our *warning* to
the user is a separate thing, and it uses the WCAG AA threshold of **4.5**. The warning appears
when even the best choice of the engine is still hard to read. So 6 selects the text color, and
4.5 raises the warning. A chip can pass selection and still raise the warning.

*Alternative considered:* keep the numeric "vs list row: 3.2" contrast readout of the artifact.
Rejected. A HA user has no calibration for a ratio. The illegible text carries the same
information, and the user reads it instantly.

### 4.4 Neutral ramp — **keep the strip, strip the metadata. Full width**

| Artifact | Verdict |
|---|---|
| 11 swatches in a row | **Keep** — this is the section, and it now gets the full preview width |
| Step name under each (`05`, `10`, …) | **Keep** |
| `--neutral-05` under each | **Cut** — the step number already *is* the name |
| hex | **Keep**. It moves to a tooltip below ~28px per swatch (§1.5) |
| rgb | **Cut** |
| Description mentioning "tune warmth and tint in Tweaks" | **Rewrite** — no such control exists in v1. New copy: *"The backbone of the theme. Every background, border and text color is a step on this ramp."* |

Renders **once, full width, tagged `Both modes`** (§1.2).

### 4.5 Extended palette → **"Entity colors". The heaviest cut**

The artifact renders nineteen cards. Each card holds a tint tile with a color dot, a label, a var
name, a contrast row, a hex, and sometimes a ramp-link select. That is six pieces of chrome per
color, and 114 in total. This group of values mostly tints entity icons.

| Artifact | Verdict |
|---|---|
| Card chrome around every hue | **Cut** |
| Tint tile + inset dot construction | **Cut** — one flat swatch |
| `--{name}-color` under each | **Cut** — the label is the name |
| `vs list row` contrast readout | **Cut** |
| Ramp-link `<select>` for the greys | **Cut** |
| The `light-grey` / `grey` / `dark-grey` trio | **Cut from this section** — they are neutral ramp aliases and are already visible in §4.4. Leaves exactly 18. |
| hex | **Keep**, muted mono under the name |

Result: a flat grid of **18 named swatches, 6 across, full width**, tagged `Both modes`. Section
description: *"These color entity icons and badges — a light is amber, a lock is red."*

This is the single biggest reduction in the audit: ~114 elements down to 36.

### 4.6 Applied demo → **"Living room". Keep, promote to first, extend slightly**

The room card is the best part of the artifact, and it needs the least work. It has five entity
tiles, a brightness slider, and a room header with temperature and humidity. It already renders
in both modes.
**Keep it essentially as-is.** Rename the section to `Living room`. It is a dashboard, so it takes
the label of a dashboard, not the label of a design exhibit.

It exercises: card background, primary background, divider, both text colors, primary, and the
border radius. It does **not** exercise error / warning / success / info, or the extended palette.
It does not exercise Headings, Longform or Code either — the room header MUST render in
`--ha-font-family-body`, not `--ha-font-family-heading`, because it copies Home Assistant's own
`ha-card` header rule (§4.2 has the citation). Do not special-case the header to the heading
knob. That renders a font combination the real exported theme never produces.
So M5 adds **one second card** below it, in the same two-panel grid:

- a row of four entity icons in extended-palette colors (amber light, red lock, blue climate,
  green sensor) — proves the palette knob does something visible
- a primary `Button` and a secondary `Button` — proves `--text-primary-color` on `--primary-color`
- one alert strip in each of error, warning, success, info — proves those four knobs
- one entity row in the disabled/unavailable text color

That is one extra card, not a dashboard. Everything in both cards MUST be built from theme
variables — zero hardcoded colors (M5 acceptance criterion).

### 4.7 Generated values — **cut as a section**

Moved to the export `Sheet` (§1.4). Settled — no live YAML panel, no counter (§7, O-4).

### 4.8 Also cut

- The artifact's **light/dark toggle button** in the header, the one that switched the *preview*'s
  own mode — still decided against (PLAN §3 decision 4). The preview carries no mode state of its
  own. Light and dark render side by side, always. The app bar's own light/dark/auto toggle
  (§1.1) is a different control, for the builder's own chrome only, and does not reverse this —
  see §1.1 for the full distinction.
- The **"Tweaks" panel** concept (warmth/tint/L/C sliders) — presets only in v1 (PLAN §3.6).
- The artifact's **footer paragraph** about methodology.

---

## 5. Empty and edge states

### 5.1 First load

**There is no empty state.** The page loads `derive()` with no arguments, that is `DEFAULT_CONFIG`,
with every knob populated, every preview section rendered, and the Export button enabled.

That default is **Home Assistant Refined**, *not* the theme HA ships today. PLAN §3 decision 9
(✅ 2026-08-11) settled this. `template.css` is a redesign. About 40 variables per mode differ
from stock, and the product models only the refined theme. So the UI must **never** call the load state
"the Home Assistant default" — it is the starting point, and stock HA is an M7 starter preset.

Consequences for copy, all of them MUST:

- The reset button reads **"Reset to defaults"**, not "Reset to Home Assistant defaults".
- Nothing in the UI claims the untouched export matches a stock HA install, because it does not.
- The theme name field starts at `DEFAULT_CONFIG.name` = **`My Theme`** (§1.4).

The only first-load affordance is one line under the app title:
*"Turn the knobs on the left. Everything updates live, in light and dark at once."*
It is not dismissible and not a modal. **Reset to defaults** is disabled until at least one knob
differs from `DEFAULT_CONFIG`.

### 5.2 No loading state

The engine is synchronous and client-side. There are no spinners, no skeletons, no "generating…".
If a knob change ever takes long enough to need one, that is an engine bug, not a UX problem.
Webfont loading is the one asynchronous thing. `display=swap` handles it and no UI acknowledges it.

### 5.3 Extreme color choices

The rule: **warn, never block.** It is the user's theme.

| Situation | Behavior |
|---|---|
| Text on a brand/status color falls below 4.5:1 | Warning glyph on that chip in the preview (§4.3) **and** a warning row at the bottom of that knob's popover. Both name the problem in plain words: *"White text on this color is hard to read."* |
| A brand color is so light or dark that its generated ramp clips at one end | No special UI. The engine clamps. The ramp preview renders the flattening honestly. |
| Secondary text falls below 4.5:1 on the card background in either mode | One warning row under the **Base tone** group: *"Secondary text is low contrast in dark mode with this base tone."* |
| Card background = Primary background (both White, or both Neutral 95) | Allowed. The Surfaces preview renders the two tiles as identical. That is the honest feedback. No warning. |
| Invalid hex typed | §2.4 — field errors, value unchanged. |

Warnings are `Alert variant="default"` with a `TriangleAlert` icon and muted styling — informational,
not destructive. Never a toast. Toasts are for things that already happened.

### 5.4 Cross-knob interactions

- **Changing the base tone** re-renders the three Surfaces controls, the ramp preview section, and
  every preview panel. Constrained knobs (border, card background, primary background) store a
  *reference* to a ramp step, so they follow the new ramp automatically. It has no effect inside
  an open color popover — the popover no longer offers neutral-ramp swatches (§2.2), so nothing
  in it depends on the base tone.
- **Brand and status colors, target behavior (§2.7, O-3, blocked on an engine change):** a color
  picked from the entity palette follows that preset when it changes. A typed or dragged color
  stores a literal hex and never moves. **What ships today:** every brand and status color still
  stores a literal hex, because `ThemeConfig.colors.*` has not changed type yet. If you pick an
  entity-palette color and the palette preset later changes, that color does **not** move, in M3
  and M4, until the engine change in §2.7 lands.
- **Changing the extended palette** re-renders the palette swatch group in open popovers and the
  §4.5 section. It does not touch any other knob.
- **Reset to defaults** opens an **`AlertDialog`**, not a `Dialog`. It is a destructive
  confirmation, and it clears the Recent list from `localStorage` too (§2.6), not only from
  memory.

---

## 6. Notes to implementers

### 6.1 For M3 — preview pane

1. Build the two-column grid first. No column header, sticky or not (§1.2) — every section fits
   straight into the grid. Sections that render once span both columns (`col-span-2`) and carry a
   `Both modes` `Badge`.
2. **Scoped variables only.** Set the generated CSS custom properties with
   **`toCssProperties(theme, mode)`** on the light panel container and the dark panel container.
   It already returns `--`-prefixed keys and already merges `common` with that mode's overrides,
   so you never touch `theme.light` / `theme.dark` yourself (those are *disjoint* partial maps —
   `theme.light` alone is missing every mode-independent variable). Use `modeVars` if you need the
   same map with bare keys.

   ```ts
   for (const [prop, value] of Object.entries(toCssProperties(theme, "light"))) {
     lightPanelEl.style.setProperty(prop, value)
   }
   ```

   **Never on `:root` or `document.documentElement`** — the builder's own shadcn/Tailwind theme
   lives there and must not be touched (analysis §7.7, CLAUDE.md).
3. Preview components style themselves **exclusively** with `var(--ha-*)` / legacy theme vars.
   No Tailwind color utilities inside a preview panel — `bg-white`, `text-neutral-500`,
   `border-gray-200` are all bugs. Layout utilities (`flex`, `gap-4`, `grid`) are fine.
4. Preview components are **read-only**. No `<input>`, no `<select>`, no click handlers that
   change theme state. The one exception is the mock UI *inside* the applied demo (M5). A toggle
   or a slider there can be visible, but it MUST be inert (`aria-hidden` where appropriate,
   `pointer-events: none`, `tabIndex={-1}`), so that it never enters the tab order.
5. Section order is §1.3. Section chrome (label + rule + description) is one shared component.
6. Do not memo-optimize prematurely. The whole preview re-rendering on a knob change is fine at
   this size. If it is not, memoize at the section boundary.
7. The user can set `--divider-color` to fully transparent, or `--primary-background-color` to
   white. The preview panels must survive both. Panel separation must not depend on a theme
   variable alone. Give each panel a fallback outline in the *builder's* border color.
8. The **Neutral ramp** section renders `theme.ramps.neutral` through `rampEntries()`, not the raw
   preset. Today the two are identical for every base tone. The derived theme keeps the section
   correct if that ever changes. The **Entity colors** section reads
   the palette values out of `modeVars(theme, "light")` under the `{name}-color` keys, iterating
   `PALETTE_COLOR_NAMES` for order.

### 6.2 For M4 — knob sidebar

0. **The store shape is `ThemeConfig`, verbatim.** Do not invent a parallel UI state shape. Every
   knob writes one field of the engine config, and the whole config is JSON-serializable.
   `resolveConfig()` and `DEFAULT_CONFIG` then give you the load state and the "is it dirty?"
   comparison for free. Field names and option unions are in §3.2 and `src/engine/types.ts`.
   `derive()` throws `TypeError` on a malformed seed hex. It throws `RangeError` on an unknown
   font, ramp or palette id. It never substitutes a value silently. So the hex field must validate
   before it commits (§2.4). Preset ids must be read from the preset arrays, never from a string
   literal.
1. Fifteen knobs, five groups, §3.2. Labels verbatim from `template.css`.
2. **Zero `<input type="color">`.** Grep for it before opening the PR.
3. Three distinct color controls, not one: popover picker (×6), inline mini-card list for Border
   color (×1, five named steps — §2.5), inline 4-swatch row (×2). §2.1.
4. The popover's swatch groups read from the *current* ramp and palette preset in the store — they
   are derived state, not props frozen at mount. To check this, open a popover, change the base
   tone in the sidebar behind it, and watching the strip change.
5. Hex commits on Enter/blur, not per keystroke (§2.4).
6. Each Border color mini-card renders a real `1px solid ${rampHex}1f` border over that half's
   own card background, not a precomputed blend — the browser composites it live (§2.5).
7. Font `SelectItem`s render in their own typeface. The list, its grouping and its order all come
   from `FONTS` + `FONT_CATEGORY_LABELS`, never a hardcoded array (§3.2). Load
   `FONTS.filter(f => f.needsWebfont)` in the builder's `index.html`.
8. Roving tabindex on every swatch group. This is the only non-trivial a11y work in M4 and it is
   an acceptance criterion. Base UI's `RadioGroup` gives it for free — prefer it over hand-rolling.
9. A knob change updates the preview immediately. Debounce only the drag on the saturation
   square, to ~16ms or one `requestAnimationFrame`. Every other change is discrete.
10. The Typography group loads with only Body visible. Headings, Longform and Code sit inside a
    `Collapsible`, closed at load, opened by a **More** trigger (§3.2, O-6).
11. `ThemeConfig.colors.*` stays `Hex`. Do not build the "picked color follows its preset" behavior
    from O-3 (§2.7, Change 1) — it needs an engine change this milestone does not ship. Build the
    popover and the inline swatch groups exactly as §2.2–§2.5 specify: a swatch click writes a
    literal hex, same as any custom pick.
12. Recent colors persist to `localStorage` per §2.6. Read, prune and write on the same schedule
    that section specifies, and use the session-only behavior instead if `localStorage` throws.
13. `borderColor` stays `NeutralSlotId`, with no `"match-card"` sentinel. Do not build the
    **Invisible** step or the `--shadow-color` fix from §2.7, Change 2 — both need the same
    unshipped engine change as item 11. Build Hairline through Strong (§2.5) against the four
    existing `NeutralSlotId` values. Leave the fifth row out, or render it visibly disabled with a
    tooltip that names the blocker, until the engine ships `"match-card"`. Say which you picked in
    the PR.

### 6.3 shadcn components expected

**This is a Base UI project, not Radix.** `components.json` pins `"style": "base-nova"`, the
components import from `@base-ui/react/*`, and `radix-ui` is no longer a dependency. Consequences:
composition uses Base UI's `render` prop, **not** Radix's `asChild`. `onOpenChange(open, details)`
with `details.cancel()` replaces `onInteractOutside`. And the toasts use `toast`, not Sonner.
Read the `shadcn` skill before writing UI.

**Install via the CLI only** — `pnpm dlx shadcn@latest add <name>`. Never hand-write or hand-port a
component (CLAUDE.md). Editing `src/components/ui/` afterwards is fine, but say so in the PR.

Already in the repo: `button`, `card`.

To add. Every one of them returned 200 from
`https://ui.shadcn.com/r/styles/base-nova/<name>.json` on 2026-08-11, `collapsible` re-checked
2026-08-14 — §6.4):

| Component | Used for |
|---|---|
| `popover` | Color picker (§2.2) |
| `collapsible` | Typography group's **More** disclosure (§3.2, O-6) |
| `toggle-group` | The app bar's Auto/Light/Dark mode toggle, single-select, three items (§1.1) |
| `input` | Hex field, theme name |
| `label` | Every knob |
| `field` | *Recommended* wrapper for a knob row — `FieldLabel` / `FieldDescription` (the helper text) / `FieldError`. Saves hand-rolling the label + help + error stack fifteen times. Pulls in `label` and `separator`. |
| `select` | Font dropdowns (`SelectGroup` + `SelectLabel` required) |
| `radio-group` | Ramp picker, palette picker, all swatch groups (`RadioGroup` + `RadioGroupItem`) |
| `dialog` | "Compare all" tables — needs a `DialogTitle` |
| `alert-dialog` | Reset confirmation (destructive → `AlertDialog`, not `Dialog`) |
| `sheet` | Export panel. Sidebar below 1024px — needs a `SheetTitle` |
| `tabs` | Export sheet (`TabsTrigger` inside `TabsList`) |
| `tooltip` | Swatch hex on hover/focus |
| `separator` | Sidebar group dividers (never a raw `<hr>` or bordered `<div>`) |
| `scroll-area` | Sidebar, YAML block |
| `alert` | Contrast warnings, install instructions (`AlertTitle` + `AlertDescription`) |
| `badge` | `Light` / `Dark` / `Both modes` tags (never a hand-styled `<span>`) |
| `toast` | "Copied to clipboard" — the Base UI toast. **Not `sonner`**, which is the Radix/React-Aria choice. It is still in the registry, so it is easy to install the wrong one. |

Third-party to add: **`react-colorful`** (PLAN §3.7), not currently a dependency.
`pnpm add react-colorful`. No other UI dependency.

Icons: `lucide-react`, already installed. Checked export names in the installed version —
`CheckIcon`, `TriangleAlertIcon`, `CopyIcon`, `DownloadIcon`, `RotateCcwIcon`, `ChevronDownIcon`,
and, checked **2026-08-14** for the mode toggle (§1.1), `SunIcon`, `MonitorIcon`, `MoonIcon`.
(`AlertTriangle` is the old name and still resolves, but prefer `TriangleAlertIcon`.) Icons inside
a `Button` take `data-icon="inline-start"` / `"inline-end"` and **no sizing classes** — the
component sizes them.

**Do not use:** the shadcn `sidebar` block (§1.1). `command` / `combobox` for the font pickers
(nineteen items in five groups do not need search). `native-select` (we need per-item typefaces,
which a native `<option>` cannot render reliably across browsers).

*Latitude:* `toggle-group` also works for the 4-swatch background rows, and `item` works for the
preset rows. I recommend `radio-group` for both, because one pattern then covers every swatch
group in the app. If you find `toggle-group` cleaner for the 4-option case, say so in the PR
rather than mixing both patterns silently.

### 6.4 Versions checked

Re-checked on **2026-08-11** against three sources: the live `ui.shadcn.com` registry, the npm
registry, and the installed packages. The shadcn registry was not reachable when this spec was
first written, and it is reachable now. If a long time passes after that date, check these facts
again. Do not trust this document alone for them.

| Thing | Checked |
|---|---|
| `@base-ui/react` | **1.7.0**, installed. `radix-ui` is no longer a dependency, so every Radix reference in the first draft of this spec was wrong. `PopoverRootChangeEventDetails` carries `reason` (one value is `"outsidePress"`), `event` and `cancel()`. The refinement in §2.3 uses those three. |
| shadcn style | `components.json` → `"style": "base-nova"`. All 17 components in §6.3 return 200 from `https://ui.shadcn.com/r/styles/base-nova/<name>.json`. `radio-group` exports `RadioGroup`, `RadioGroupItem` from `@base-ui/react/radio{,-group}`. `popover` exports `Popover`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger` — note there is **no `PopoverAnchor`**. |
| `collapsible` | Checked **2026-08-14**, for O-6. Returns 200 from `.../base-nova/collapsible.json`. Exports `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@base-ui/react/collapsible`, against the same `@base-ui/react` 1.7.0 already installed. No new dependency. |
| `toggle-group` | Checked **2026-08-14**, for the app bar mode toggle (§1.1). Returns 200 from `.../base-nova/toggle-group.json`, with a `toggle` registry dependency the CLI installs alongside it. Exports `ToggleGroup`, `ToggleGroupItem` from `@base-ui/react/toggle-group` and `@base-ui/react/toggle`. No new npm dependency, same `@base-ui/react` 1.7.0. |
| `react-colorful` | **5.8.0**, published 2026-07-13, **not yet a dependency**. Peer deps `react >=16.8.0` — React 19 is fine. Exports whole pickers only (`HexColorPicker`, `HexColorInput`, …). **no** saturation/hue sub-exports. Arrow keys move in 5% steps. Interactive areas are `tabIndex=0` `role="slider"` with `aria-valuetext`. `aria-label` is hardcoded `"Color"`. `validHex` accepts 3- and 6-digit. |
| `lucide-react` | **1.31.0**, installed. Both `TriangleAlert` and `TriangleAlertIcon` are exported. Same dual naming for the rest. |
| `culori` | **4.0.2**, installed — the engine's only dependency. The UI has no reason to import it directly. The color helpers it needs (`contrastRatio`, `normalizeHex`, `isHex`, `withAlpha`, …) are re-exported from `@/engine`. |
| Engine facts | `DEFAULT_CONFIG` read from `src/engine/derive.ts`. `FONTS` / `FONT_CATEGORY_LABELS` from `presets/fonts.ts`. `NEUTRAL_RAMPS`, `EXTENDED_PALETTES`, `PALETTE_COLOR_NAMES` from `presets/`. Every default, id, label and ordering in §3.2/§3.3 was read out of the source, not carried over from the pre-engine draft. |

Egress this session: `ui.shadcn.com`, `registry.npmjs.org` and `raw.githubusercontent.com` all
reachable. The local shadcn skill at `.claude/skills/shadcn/` has the composition, icon and styling
rules, including the differences between Base UI and Radix.

---

## 7. Decisions from the owner — 2026-08-14

O-1 to O-8 are now settled. This table keeps each original question for the record and states
the decision next to it. Later sections cite a decision as `(§7, O-n)`.

| # | Question | Decision |
|---|---|---|
| **O-1** | Do the three constrained knobs (border, card background, primary background) use the same popover as the other six, for uniformity? Or inline swatch rows, as this spec says? | **Inline**, as this spec already writes it. No change. |
| **O-2** | `template.css` labels the extended palette knob **"Home Assistant colors"**. Inside a Home Assistant theme builder that reads as "the colors", not as "the eighteen named entity colors". Keep the label verbatim, or change it to **"Entity colors"** or **"Named colors"**? | **Relabel the knob to "Entity colors."** Every place in this spec that named the knob or its preview section now reads "Entity colors" (§1.3, §2.3, §3.2, §3.3, §4.5). `template.css`'s own string stays as it is — only the UI label changed. |
| **O-3** | A user picks a color *from* the ramp or palette strip, then changes the preset. Does that color follow the preset, or does it stay? This spec's earlier draft said it stays, and stores a literal hex. | **REVERSED.** A color picked from a palette swatch follows that preset when the preset changes. The config stores the picked hue, not the resolved hex. A later review comment cut the ramp as a swatch source for this popover entirely (§2.2), so only the palette half of this decision still applies. This needs a change to the frozen engine API, so it is **blocked** — §2.7 Change 1 has the full specification and the block. M3 and M4 build today's literal-hex behavior until a separate engine work package ships the change. |
| **O-4** | The always-visible "Generated values" YAML section is cut in favor of an export sheet. Keep the live YAML as a permanent panel? | **No**, and the "12 variables changed" counter this spec's earlier draft floated as a cheaper trust signal is also cut. A plain **Export theme** button, no counter (§1.4). |
| **O-5** | Applied demo promoted to the **first** preview section, above the token sections. Agreed? | **Yes.** No change (§1.3, §4.6). |
| **O-6** | Font shortlist sign-off (PLAN §3, ✅ 2026-08-09): 8 sans, 4 serif, 2 display serif, 2 mono and 3 system, 19 items in one grouped list, shared by all four font knobs. Is one dropdown of 19 items acceptable? | **Yes**, one grouped `Select`, each item in its own typeface, unchanged from this spec's earlier draft — **plus progressive disclosure.** At load, only **Body font family** shows. A **More** `Collapsible` reveals Headings, Longform and Code. Most users only care about the body font (§3.2). |
| **O-7** | Recent colors are session-only, and a reload loses them. Move them to `localStorage`? | **REVERSED.** Recent colors persist to `localStorage`, with a 7-day staleness period **per entry** — each entry carries its own last-used time, and a read drops any entry past 7 days. Storage key, entry shape and the cleanup point are at §2.6. |
| **O-8** | The ramp picker rows take their labels from `preset.label`, so eight of the ten read **"Stone (Tailwind)"**, "Zinc (Tailwind)" and so on. In a sidebar 300px wide, that suffix takes a third of the row, eight times over. Remove the suffix in the UI, or change the engine labels? | **Remove it in the UI.** The sidebar list renders "Stone". The compare-all dialog keeps the full `preset.label`, suffix included (§3.3). The engine's own label is untouched — its API stays frozen. |

### 7.1 Flag responses — 2026-08-14

The same PR round also carried five items under "Still flagging" — judgment calls for the owner's
attention, not open questions. The owner responded to each.

| Flag | Response |
|---|---|
| The four font knobs have no preview anywhere. | Overstated. The Body font already renders in the applied demo. Corrected at §4.2 — only Heading, Longform and Code lack an organic preview surface, and the type specimen is their one preview. |
| The extended palette cut is the heaviest in the audit, 19 cards down to 18 flat swatches. | Approved. No change (§4.5). |
| The numeric contrast readout stays gone, replaced by the on-color chip (§4.3). | The chip stays, and the CSS variable name under every preview swatch is now also cut — Surfaces and Text included, not only the sections that already cut it (§4). |
| The sidebar is a ~1300px scroll with all five groups open. | Approved. No change (§3.1). |
| `--ha-font-size-scale` sits in `template.css` with no `KNOB` annotation, flagged in case that was an upstream oversight. | Confirmed out of v1 (PLAN §3, decision 8). Dropped. |

### 7.2 Border color — a second round, 2026-08-14

A separate topic from O-1 to O-8, raised after that round closed. The owner's objection: the
12%-alpha ramp strip reads as a row of near-identical light greys, and it hides that the pick also
drives `--outline-hover-color` and `--shadow-color`, not only the divider line.

| Part | Decision |
|---|---|
| Render the outcome | **Approved.** Each option is a mini-card — real card background, real border, real shadow — split diagonally, light half top-left, dark half bottom-right, both modes visible at once. §2.5 has the anatomy. |
| Four named steps, not eleven slots | **Approved.** Hairline / Subtle / Medium / Strong, each darker than the card and darker than the step before it. UI-only — `borderColor` stays `NeutralSlotId`, no engine change. §2.5 has the slot picks and the rendered evidence behind them. |
| A fifth step, Invisible | **Approved.** Resolves to the chosen card surface, so the border disappears into the card. Needs a new engine sentinel and a fix to `--shadow-color` so the shadow survives it — both **blocked**, specified at §2.7 (Change 2), folded into the same work package as O-3 (§2.7, Change 1). |

**One work package, three changes, all blocked on the same PM decision to unfreeze the engine
API.** None of the three is buildable in M3 or M4:

1. `ThemeConfig.colors.*`: `Hex` → `SeedColor` (O-3, ramp-relative brand and status colors — §2.7,
   Change 1).
2. `ThemeConfig["borderColor"]`: `NeutralSlotId` → `NeutralSlotId | "match-card"` (the Invisible
   border step — §2.7, Change 2).
3. `derive.ts:453`: `--shadow-color` no longer shares its base with the border knob. It reads a
   fixed `neutral-05` instead, so a borderless card can still cast a shadow (§2.7, Change 2). This
   one is a plain correctness fix, not a type change, but it rides along because Change 2 is what
   makes the existing bug show up in the most common case (Invisible against the default card).

§6.2 items 11 and 13 tell M3/M4 what to build in the meantime: today's literal-hex colors, and a
four-step Border color control with the fifth row left out or shown disabled.

---

## 8. Summary of changes against the artifact

| | Artifact | This spec |
|---|---|---|
| Control surface | Sidebar **and** in-preview editing | Sidebar only |
| Color input | `<input type="color">` under an opacity-0 overlay | Custom popover, palette-first |
| Light/dark | A toggle button | Two permanent columns |
| Section count | 7 | 6 (5 token + 1 demo) |
| Applied demo position | 6th | 1st |
| Per-swatch metadata | label + var + hex + rgb + select + reset | label + hex (+ var where it matters) |
| Extended palette | 19 cards, ~114 elements | 18 flat swatches, 36 elements |
| Export | Section at the bottom | Sheet from the app bar |
| Font preview | None | Type specimen in "Text & type" + fonts rendered in the dropdown |
| Ramp/palette choice | A `<select>` of names | Ten/eight stacked strips + a compare-all table |

---

## 9. Revalidation log — 2026-08-11

This spec was drafted in parallel with M1, before `src/engine/` existed and while the scaffold was
still Radix. Both landed. What that invalidated, and what changed:

| Was | Now | Where |
|---|---|---|
| Radix primitives, `onInteractOutside`, `asChild` | **Base UI** (`@base-ui/react` 1.7.0), `onOpenChange(open, details)` + `details.cancel()`, `render` | §2.3, §2.4, §3.3, §6.2, §6.3 |
| `sonner` for toasts (+ a `next-themes` workaround) | **`toast`** — the Base UI one. The workaround was for a component we no longer use. | §1.4, §6.3 |
| Theme name `my_theme`, slugified to `^[a-z][a-z0-9_]*$` | **`My Theme`** (`DEFAULT_CONFIG.name`), no slug rule — `toYaml` does not slugify and HA accepts spaces | §1.4 |
| Font groups **System first**, headings "Sans"/"Mono" | Engine order — **System last** — and `FONT_CATEGORY_LABELS` wording: "Sans-serif", "Monospace" | §3.2 |
| Ramp order `ha, gray, slate, …`, labels "Stone" | `NEUTRAL_RAMPS` order `ha, rounded, slate, gray, …`, labels "Stone (Tailwind)" | §3.3, O-8 |
| Palette order with Bulma 4th | `EXTENDED_PALETTES` order — Bulma is 7th | §3.3 |
| Border color default unstated (wireframe used `neutral-80`) | **`neutral-05`**, the darkest slot — that is where `#0000001f` comes from | §3.2 |
| "loads with the complete Home Assistant default theme" | **Home Assistant Refined**, PLAN §3 decision 9. Reset button reworded. No UI claims parity with stock HA. | §5.1 |
| Contrast "4.5" used ambiguously | **6 selects** (`contrastingText`, HA's rule), **4.5 warns** (WCAG AA). Use the engine's `contrastRatio`. | §4.3, §5.3 |
| Data flow described loosely | `derive()` / `toCssProperties()` / `modeVars()` named, plus the trap that `theme.light` is a *partial* map | §6.1 |
| Store shape unstated | The store **is** `ThemeConfig`. `derive()` throws rather than substituting | §6.2 |

The inlined preset data of the wireframe is now diffed against the engine, cell by cell. The diff
covers 10 ramps × 11 slots, 8 palettes × 18 hues, the hue order, 5 font groups with their
membership, and 6 brand defaults. Every cell matches.

Unchanged and still believed right: the whole of §1 (layout), §2.1–2.2 (which knob gets which
control, popover anatomy), §3.1 (five always-open groups), §4 (the content audit), and O-1…O-7.

---

## 10. Language

This document follows **ASD-STE100 Simplified Technical English**, pragmatic mode, like
`CLAUDE.md`, `docs/PLAN.md` and `src/engine/README.md`. The pass changed the wording only. No
decision, recommendation or acceptance criterion changed, and O-1 to O-8 kept their meaning at the
time of that pass. A later round with the owner (§7, 2026-08-14) settled O-1 to O-8 and reversed
two of them — that is a content change, not a language edit, and every later edit in this document
still follows the conventions below.

Conventions, so that later edits stay consistent:

- **American spelling.** `color`, not `colour`. The engine and the CSS variables already use
  `color`, so the prose now agrees with the identifiers.
- **No semicolons** (Rule 8.1). Two sentences instead.
- **Approved modals only:** `can`, `will`, `must`. No `should`, `would`, `may`, `might`, `could`.
  A requirement is **MUST**. A recommendation is stated as a fact.
- **One verb per concept** (Rules 1.11, 9.4). This document uses `render` for the act of a
  component producing output, and `check` for a correctness test. It never rotates to `show`,
  `draw`, `display`, `verify`, `confirm` or `ensure`.
- **25 words per sentence** for descriptive text (Rule 6.3).
- **Untouchable** (Rules 1.5, 8.6): code blocks, inline code, identifiers, CSS variables, hex
  values, file paths and quoted text. `blue-grey` and `Display serif` keep their spelling because
  they are identifiers in `PALETTE_COLOR_NAMES` and `FONT_CATEGORY_LABELS`. The quoted artifact
  string `"vs list row: 3.2"` also stays exact.
