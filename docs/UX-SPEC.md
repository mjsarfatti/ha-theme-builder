# HA Theme Builder — UX Spec (M2)

> Last updated: 2026-10-26
> Wireframe: [`docs/wireframe/index.html`](./wireframe/index.html). Open the file directly in a
> browser (no server, no build step). The wireframe has deliberately low fidelity. It is a
> communication device. Production code starts from this spec. **Real data:** all ten neutral ramps and all
> eight extended palettes carry their real hex values from `.references/colors/`. The wireframe
> exists to test the comparison of these presets. Everything else is a gray box. The wireframe has
> no connection to the theme engine: the preview panels do not recolor, and the wireframe has no
> real color math.
> Gates: **M3** (preview pane) and **M4** (knob sidebar). Informs **M5** (applied demo) and **M6** (export).

This document is the single source of truth for the v1 UI. M3 and M4 implementers can build from
this document alone.

- **MUST** = an acceptance criterion. A change requires a PM decision.
- ***Recommended*** = a suggested implementation route. The implementer can choose a different
  route. If you choose a different route, state it in the PR.

On 2026-08-11 a check of every library, component and API named here used three sources: the
live registry, the upstream sources, and the merged engine. §6.4 lists the results. Check them again
before you build.

**Where this spec and `src/engine/` disagree, the engine wins.** Its API is frozen (CLAUDE.md).
Every default, id, label and ordering below comes from the engine source. If you find another
gap, stop and ask the owner to clarify. Do not resolve the gap yourself, and do not work around
the engine.

---

## 0. The one-sentence design

**Turn a knob on the left, watch your Home Assistant dashboard change on the right, in light
and dark at once, then select Export.**

Three decisions follow from this sentence:

1. **The preview is read-only.** The sidebar is the only place to change a value. The artifact
   also lets the user edit colors *inside* the preview (color inputs on swatches, ramp-link
   dropdowns, reset links). That is a second control surface that competes with the sidebar.
   The preview does not include these controls.
2. **The applied HA dashboard comes first.** The artifact places it at position 6. For a user
   who has never thought about design tokens, the dashboard *is* the answer to "does this look
   good". The token sections are the detail below it.
3. **Export is always one click away.** Export is a button in the app bar.

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
  **Reset to defaults** button (disabled until a knob changes), and the primary **Export
  theme** button.
- The **sidebar** is a fixed-width `<aside>` with its own scroll container. It does not collapse
  on desktop, and it is not inside an accordion (see §3.1).
- The **preview pane** is the only long scroll. It fills the remaining width.

**Do not use the shadcn `Sidebar` block.** It brings a provider, cookie persistence, a rail, and
collapsible state that this app does not need. Use a plain `<aside class="w-[340px] shrink-0 border-r">`
that wraps a `ScrollArea`. The Sheet-based mobile fallback (§1.5) is the only collapsing behavior.

**The app bar carries a light/dark/auto mode toggle for the builder's own chrome only** (owner
decision). The toggle has three states in one `ToggleGroup` (`ToggleGroupItem` ×3) with the icons
`SunIcon` / `MonitorIcon` / `MoonIcon`. It is single-select and sits between the product name and
**Reset to defaults**.

- **Auto** is the default. It follows the OS through `prefers-color-scheme`. It updates live
  when the OS setting changes while the app stays open.
- **Light** and **Dark** pin the builder's own chrome to that mode, regardless of the OS setting.
- The choice persists to `localStorage`, key `"ha-theme-builder:color-scheme"`, value `"auto" |
  "light" | "dark"`. A read on load restores it. A missing or unreadable key means `"auto"`.

**This toggle MUST NOT change the preview.** It changes the sidebar, the app bar and the light or
dark rendering of every control. It changes shadcn's own theme and does not change `--ha-*`
variables. The two preview columns stay permanently light and dark, side by side, as PLAN.md §3
decision 4 and CLAUDE.md require: *"Light and dark previews show side by side, always. No mode
toggle."* The toggle is a separate control with a separate rule and a separate set of variables.
Do not read the state of this toggle anywhere inside a preview panel. The preview has no mode
state of its own. §4.8 repeats this distinction for the artifact's own toggle, a different control
for the preview, which this app does not include.

### 1.2 The light/dark rule

**Column 1 is always light. Column 2 is always dark.** The preview has no column label, sticky
or not. The background of each panel states its mode: the light panel is visibly light, and the
dark panel is visibly dark. Every section aligns to the same grid, so a reader learns the rule
once, from the first section, and it holds for the whole scroll.

The rule has exactly one exception:

| Section content | Rendering |
|---|---|
| Values that differ between modes | **Two panels**, light left / dark right |
| Values that are identical in both modes | **One full-width panel**, tagged `Both modes` |

The neutral ramp and the extended palette are mode-independent. The ramp emits the same eleven hex
values for light and dark, and the palette emits the same eighteen. Only the elements that
*consume* them change. A double rendering duplicates the content and halves the width of the two
sections that need width most (11 and 18 swatches). These two sections therefore span the full
preview width.

Each **panel** is a rounded container. Its background is the `--primary-background-color` of that
mode, and its hairline border is the `--divider-color` of that mode. The panel frame is part of
the preview. Panels in a row have equal width and top alignment. Panels can differ in height.

### 1.3 Preview section order

1. **Living room** — the applied HA demo (M5)
2. **Surfaces & dividers**
3. **Text & type**
4. **Brand & status**
5. **Neutral ramp** *(full width, both modes)*
6. **Entity colors** — the extended palette *(full width, both modes)*

A section header has three parts: a small uppercase label, a hairline rule across the full
preview width, and a one-line description of what the section controls. No section is
collapsible.

### 1.4 Where export lives

**Export is a `Sheet` that slides in from the right.** The primary button in the app bar opens
it. The sheet contains:

- **Theme name** — an `Input` with the default **`My Theme`** (`DEFAULT_CONFIG.name`). The name
  becomes the YAML key verbatim. `toYaml` does not slugify, and HA accepts spaces. The only rule
  is that the name is not empty. Do not add a slug regex, because the engine does not accept one.
- **`Tabs`** with two tabs (`TabsTrigger`s inside a `TabsList`, never directly in `Tabs`):
  - **YAML** — the generated theme in a `<pre>` inside a `ScrollArea`. The **Copy** and
    **Download** buttons sit above it. The downloaded file name is the slugified theme name with
    the extension `.yaml`. The default `My Theme` gives `my-theme.yaml`. The slug affects only
    the file name. The YAML key inside the file stays exactly as typed, per the rule above.
    A user with several exported themes then gets several distinct file names, and each export
    does not overwrite one `themes.yaml`.
  - **Install** — numbered steps for a dedicated `themes` folder (owner decision). The steps do
    not use a paste into `configuration.yaml`. HA documents three ways to load a theme in
    `home-assistant/home-assistant.io`, the `frontend` integration page
    (`source/_integrations/frontend.markdown`, section "Theme configuration splitting"):
    inline in `configuration.yaml`, a single included file, or a folder of files merged with
    `!include_dir_merge_named`. This spec uses the folder. The export step already produces one
    file per theme, and a later export needs no second edit to `configuration.yaml`.

    1. If no `themes` folder exists next to `configuration.yaml`, create one.
    2. Save the downloaded file in that folder. The file name can differ from the theme name
       inside the file.
    3. Under `frontend:` in `configuration.yaml`, add `themes: !include_dir_merge_named themes`.
       Do this once, the first time only.
    4. The first time, restart Home Assistant. After that, a new file in the folder needs only
       the `frontend.reload_themes` action and no restart.
    5. Open your profile page and select the theme from the list.

    The Install tab also contains the `extra_module_url` font-loading snippet. It is **present
    only when Body is a non-system, non-Roboto font** (PLAN §3). v1 has one font knob (§3.2,
    §7.3), so `theme.webfonts` holds at most one entry and the export contains at most one
    snippet. When Body is a system font or Roboto, the block is absent.

The sheet is 560px wide. Esc and the backdrop dismiss it. It MUST carry a `SheetTitle` (shadcn
requires one for accessibility, and `sr-only` hides it visually). Copy fires a toast. This is a
**Base UI** project, so use the shadcn `toast` component (`toast.add({ title: "Copied to
clipboard" })`). The shadcn registry also contains `sonner`, which this project does not use (§6.3).

**The preview has no "Generated values" scroll section.** The export sheet is the one home for
export. It is always reachable, and the user does not scroll to the bottom of a 4000px page to
find it.

The **Export theme** button is a plain button (§7, O-4).

### 1.5 Responsive

The layout is desktop-first. Where noted, breakpoints refer to the **available preview width**
and not to the window width (the first column below reads "Viewport").

| Viewport | Behavior |
|---|---|
| **≥ 1440px** | Sidebar 340px. Preview two columns. All swatch labels + hex visible. |
| **1280–1439px** | Sidebar 320px. Preview two columns. Unchanged otherwise. |
| **1024–1279px** | Sidebar 300px. Preview two columns. **Compact swatch mode**: per-step hex labels in the ramp and palette sections are hidden and move to a `Tooltip` on hover/focus. |
| **768–1023px** | Sidebar undocks: the app bar gains a **Design** button that opens the sidebar in a left `Sheet`. Preview full width, still two columns. |
| **< 768px** | As above, and the preview columns **stack**: light panel above dark panel, each full width. The stacked panels have no label, per §1.2. Both modes stay visible at the same time, and the user scrolls between them. |

The two-column preview MUST NOT produce a horizontal scrollbar at any width. Wide content (the
ramp strip, the palette grid) shrinks its swatches. Below 28px per swatch, the labels disappear
per the compact rule above. The content never overflows.

This is a desktop tool. The app MUST work below 768px, and the layout is optimized for wider
screens.

---

## 2. Color picker

### 2.1 Which knobs get which control

There are nine color knobs. They are different kinds of control, so one heavyweight popover for
all nine does not fit.

| Knob | Allowed values | Control |
|---|---|---|
| Primary color | any | **Popover picker** (§2.2) |
| Accent color | any | **Popover picker** |
| Error color | any | **Popover picker** |
| Warning color | any | **Popover picker** |
| Success color | any | **Popover picker** |
| Info color | any | **Popover picker** |
| Border color | one of five named steps | **Inline mini-card list** (§2.5) |
| Card background | neutral 80 / 90 / 95 / 100 | **Inline 4-swatch row** (§2.5) |
| Primary background | neutral 80 / 90 / 95 / 100 | **Inline 4-swatch row** |

The last three knobs are *choices from a short fixed list*. A list of four options needs four
buttons. It does not need a popover, a saturation square, or a hex field. The inline form sits in
the sidebar and makes the constraint ("you can pick only from the ramp here") visible at once
(§7, O-1).

**The app contains no `<input type="color">`.** This applies to every context: as a fallback,
and behind an opacity-0 overlay (as the artifact does). This is an acceptance criterion for M4.

### 2.2 Popover anatomy

The trigger is a `Button` styled as a sidebar row:

```
┌───────────────────────────────────────────┐
│ ██  Primary color                #009ac7 ▾│   swatch 28px · label · hex, mono, muted
└───────────────────────────────────────────┘
```

The swatch is a rounded square filled with the current value. A 1px inset ring keeps white and
near-white visible. The whole row is the trigger.

The `Popover` uses `align="start"` and `side="right"` on desktop, so it opens over the preview
over the other knobs of the sidebar. Its width is 300px. The content, top to bottom:

```
┌── 300px ───────────────────────────────────┐
│ Primary color                              │  1. header
│ ██████  [ #009ac7          ]      [Reset]  │  2. big swatch + hex Input + reset
├────────────────────────────────────────────┤
│ FROM YOUR ENTITY COLORS                    │  3. extended palette, 18 hues
│ ● ● ● ● ● ● ● ● ●                          │     2 rows of 9
│ ● ● ● ● ● ● ● ● ●                          │
│                                            │
│ RECENT                                     │  4. last 8 committed custom colors
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

**The neutral ramp is not a swatch source in this popover** (owner decision). The popover offers
only the entity palette and Recent. Border color, Card background and Primary background pick
from the neutral ramp directly (§2.5). The rule about the neutral ramp applies to the six-knob
popover only.

**Palette swatches come before the free picker, always.** This order is the meaning of
"palette-aware": the anchored choice is the default path, and free picking serves a color that
the palette does not offer. A user who wants the palette amber as the accent color reaches it in
one tap and never sees a color wheel.

### 2.3 The swatch groups

**From your entity colors** — the eighteen hues of the *currently selected* extended palette.
Render them as 24px circles in two rows of nine. The order is the canonical one: red, pink,
purple, deep-purple, indigo, blue, light-blue, cyan, teal, green, light-green, lime, yellow,
amber, orange, deep-orange, brown, blue-grey. Tooltip: `Amber · #ffc107`.

**This group MUST re-render when the entity-palette preset changes**, including while a popover
is open. This mechanism makes the picker palette-aware. It is a functional requirement. The base tone (neutral ramp) is not a swatch source in this popover (see §2.2). A
change of the base tone therefore does not change anything inside an open popover, and only the
entity-palette group re-renders.

*Recommended refinement:* keep the popover open when the user changes the entity-palette preset
in the sidebar behind it. At this moment the user wants to watch the swatches change. Base UI
closes the popover on an outside press by default. Cancel that one case:

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

(`reason`, `event` and `cancel()` are all on Base UI's `ChangeEventDetails`. See §6.4.)

If this refinement is difficult to build, let the popover close. The user reopens it and sees the
new swatches.

**Recent** — up to eight most recently committed values from the free picker or the hex field,
newest first, deduplicated. All six popovers share the list, and the list persists across a
reload (§2.6). The group is hidden when it is empty and has no empty-state row.

**Selected state**: if the current value equals a swatch exactly (case-insensitive hex compare),
that swatch gets a 2px ring plus a check glyph and `aria-checked="true"`.

### 2.4 Free picking, hex entry, keyboard

**Free picker** — *recommended*: `react-colorful`'s **`<HexColorPicker color={hex} onChange={fn} />`**.
That single component renders *both* the saturation/value square and the hue slider. The package exports no saturation-only or hue-only component. Style
the picker with overrides of the `.react-colorful*` class names (the package ships its own
CSS-in-JS). Set the size with `.react-colorful { width: 100%; height: 190px }`. §6.4 has the
checked details.

The library supplies the keyboard support and the accessibility. Each area is `tabIndex=0` and
`role="slider"`, moves in 5% steps on the arrow keys, and carries an `aria-valuetext`
(`"Saturation 42%, Brightness 88%"`). **Its `aria-label` is a hardcoded `"Color"` that cannot be
overridden.** Wrap the picker in a `<div role="group" aria-label="Pick a custom color">` to give
it context. Do not reimplement the picker on a canvas.

**Hex field** — an `Input` in the header, `font-mono`.
*Recommended*: a plain shadcn `Input` with our own parsing, **not** the `HexColorInput` of
react-colorful. `HexColorInput` accepts 3-digit and 6-digit hex. It commits on every keystroke as
soon as the value is valid, and it has no error state. The rules below require a different
behavior. If an implementer prefers `HexColorInput`, the commit-on-Enter/blur rule and the
error-state rule below are lost. Raise this with the owner and do not change the behavior
silently.

- The field accepts `#abc`, `abc`, `#aabbcc`, `aabbcc`, in any case.
- The field commits on `Enter` and on blur. It does **not** commit per keystroke, because each
  commit fires the engine.
- For invalid input, the field turns destructive and an inline message reads `Enter a 3 or 6
  digit hex color`. The committed value stays unchanged. `Escape` reverts the field to the
  committed value.
- A drag on the saturation square updates the field live.

**Reset** — restores the value of this knob from `DEFAULT_CONFIG`. It is visible only when the
value differs from the default.

**Keyboard and a11y — MUST:**

| | |
|---|---|
| Trigger | `<button>`, `aria-haspopup="dialog"`, `aria-expanded`, accessible name `"Primary color, currently #009ac7"` |
| Open | `Enter` / `Space`. Base UI moves focus into the popover. Focus moves to the hex `Input`. |
| Close | `Escape` closes the popover and returns focus to the trigger. A click outside closes the popover and commits. |
| Between groups | `Tab` moves from group to group: hex → palette grid → recent → saturation → hue. |
| Within a group | **Roving tabindex.** One swatch per group is in the tab order. `←`/`→` (and `↑`/`↓` in the palette grid) move the roving focus and, per WAI-ARIA radiogroup semantics, select as they move. `Home`/`End` jump to the first/last swatch. |
| Group semantics | `role="radiogroup"` with `aria-label` on each group. Swatches are `role="radio"`. |
| Swatch names | `aria-label="Amber, #ffc107"`. A name never consists of color alone. |
| Live region | The header hex value is in an `aria-live="polite"` region, so screen readers announce changes made by dragging. Debounce announcements to 300ms. |
| Focus ring | Visible on every swatch, 2px, offset outward, in the *builder's* focus color. The ring never uses a theme color, because the user can set a theme color to an invisible value. |
| Contrast | Every swatch carries a 1px inset ring at 12% ink, so white and near-white swatches stay visible on a white popover. |

Reduced motion: the open animation of the popover respects `prefers-reduced-motion` (shadcn
default).

### 2.5 The inline pickers

**Border color.** Eleven raw ramp slots at 12% alpha composite to near-identical light greys on a
light card, so a user cannot tell the steps apart. The border pick also drives two other
variables in addition to the divider line: `--outline-hover-color` at `3d` alpha and `--shadow-color`
at `29` light / `7a` dark (`forMode()` in `derive.ts`). A color chip cannot show these effects.
**The control renders the outcome.**

**Five named steps:**

| Step | Config value | What it resolves to |
|---|---|---|
| Invisible | `"match-card"` *(§2.7)* | The card surface itself. The border disappears into the card. |
| Hairline | `"neutral-80"` | The faintest step that a user can still see. |
| Subtle | `"neutral-60"` | |
| Medium | `"neutral-30"` | |
| Strong | `"neutral-05"` — the default | The most visible of the four. |

**The engine derives the border from the card.** A `borderColor` slot gives a distance from white:
`k = 12 - position`, where the position is the index of the slot in the 13-slot neutral ramp.
Hairline has k = 3, Subtle k = 5, Medium k = 8 and Strong k = 11. The border sits `k / 12` of the
room between the card and the end of the ramp, rounded half up.

- In light mode, the room is the position of the card (down to position 0). The border is darker
  than the card.
- In dark mode, the room is `12 - card position` (up to position 12). The border is lighter than
  the card.

Hairline through Strong are progressively farther from the card, in that order. `borderColor` is a
plain `NeutralSlotId` for these four values. The five steps are a UI restriction on top of the
eleven-value union, like the restriction that the font dropdown applies to `FONTS`. The
restriction does not change the list in the engine.

**Why these four slots.** A render of all eleven slots at `1f` alpha produced the evidence. The
render used every `SurfaceChoice`, both modes, the default `ha` ramp and a tinted ramp (`mauve`),
to check that a tint keeps the four steps in the same order. The table shows the composited result
against the default card (`neutral-100`; dark card `neutral-05`) on the `ha` ramp:

| Slot | Light, composited over `#ffffff` | Dark, composited over `#141414` |
|---|---|---|
| neutral-05 (**Strong**) | `#e2e2e2` | `#2f2f2f` |
| neutral-10 | `#e4e4e4` | `#2e2e2e` |
| neutral-20 | `#e7e7e7` | `#2a2a2a` |
| neutral-30 (**Medium**) | `#e9e9e9` | `#272727` |
| neutral-40 | `#ebebeb` | `#242424` |
| neutral-50 | `#efefef` | `#242424` |
| neutral-60 (**Subtle**) | `#f2f2f2` | `#202020` |
| neutral-70 | `#f6f6f6` | `#1d1d1d` |
| neutral-80 (**Hairline**) | `#f9f9f9` | `#1b1b1b` |
| neutral-90 | `#fcfcfc` | `#181818` |
| neutral-95 | `#fefefe` | `#151515` |

Two facts follow from this table:

1. In light mode, the eleven raw slots cluster toward the light end. The slots `neutral-80`
   through `neutral-95` composite within two or three points of each other and of the card. Four
   slots that spread across the full range keep each step visually distinct. Four adjacent slots
   do not.
2. **The border never equals the card for the four named steps.** This holds in both modes and
   for every surface choice. The four steps keep four distinct positions. The offset never exceeds
   the room, so the border position stays between 0 and 12. A test checks all 16 surface
   combinations, the four steps and both modes.

The four steps keep their order in both modes: Strong is the most visible step, and Hairline is
the least visible step. They keep the same order on a tinted ramp. The four picks of `mauve`
composite to `#e3e2e3 / #eae8ea / #f3f2f3 / #f9f8f9` in light and
`#322d33 / #2a252b / #241e25 / #1e181f` in dark. The spread and the order are the same, with the
tint of the ramp.

**The mini-card.** Each of the five options renders as a small card. The card has the real card
background of that option, a real `1px` border at the alpha of the step, and a real shadow below
it. No precomputed blend is necessary: the browser composites a CSS border with an alpha color
over a background of the actual card color, so the render already **is** the on-card result.

The sidebar is mode-agnostic everywhere else. This knob reads in opposite directions per mode: the
border is darker than the card in light mode and lighter than the card in dark mode. Each
mini-card therefore splits diagonally: the light render in the upper-left triangle and the dark
render in the lower-right triangle. Both are visible at once.

Implementation: two full-size cards in a stack. The lower card is a plain rectangle for the
light half. The upper card is identical but clipped to a lower-right triangle (`clip-path:
polygon(100% 0, 100% 100%, 0 100%)`) for the dark half. Each card has its own background,
border and shadow, so the shadow clips at the same diagonal as its card. The diagonal clip
shows the reader which half to look at.

**Layout:** a vertical list with one row per step. The geometry is the same as in the ramp and
palette preset lists (§3.3): a radio dot, the label of the step at a fixed width, and then the
mini-card at 150×34px. The list is a `role="radiogroup"` with one tab stop and a roving
tabindex. The arrow keys move and select, like every other swatch group (the keyboard table in
§2.4 applies). The selected state has the same ring-plus-fill as the preset lists. The accessible
name of each row states both composited hexes, so the choice is not conveyed by color alone:
`"Strong: light #141414, dark #f3f3f3, rendered at 12% opacity"`. For the Invisible step, the name
is `"Invisible: matches the card surface in both modes"`. A helper line under the group states
the split once, because it is a new pattern: *"Each option is a small card: real background,
real border, real shadow. Light half top-left, dark half bottom-right."*

**Card background / Primary background** — a four-button row: `Neutral 80`, `Neutral 90`,
`Neutral 95`, `Neutral 100`. Each button is a swatch above a two-line label. The selected state
has a ring and a check. Helper text under both rows: *"Dark mode uses the matching dark shade
automatically."*

### 2.6 Recent colors persist across a reload

Recent colors persist across a reload (§7, O-7). Each entry carries its own age. The picker
drops a stale entry on read and does not clear the whole list at once.

- **Storage:** `window.localStorage`, key `"ha-theme-builder:recent-colors"`.
- **Entry shape:** `{ hex: Hex; lastUsedAt: number }`. `lastUsedAt` is `Date.now()` at the moment
  of the commit, in epoch milliseconds.
- **Value:** a JSON array of entries, newest first, with a cap of 8. This is the same cap that
  §2.3 sets for the Recent row of the popover.
- **Staleness applies to each entry.** The staleness period is 7 days
  (`7 * 24 * 60 * 60 * 1000` milliseconds). A read drops every entry with a `lastUsedAt` older
  than 7 days from the current time, and then writes the filtered list back to `localStorage`.
  A read happens at app load and at every popover open, so a stale entry is never present when
  a user looks at the list.
- **What writes an entry.** Only a hex committed from the free picker or the hex field writes or
  refreshes an entry. This is the same rule that §2.3 sets for what counts as "recent". A pick
  from the ramp strip, the palette grid or the Recent row itself does not write an entry,
  because that value already has a home in a group that the user can see.
- **On write:** compare the new hex with the existing entries, case-insensitive. A match moves
  to the front and gets a new `lastUsedAt`. No match prepends a new entry. In both cases, trim
  the list to 8 after the write.
- **`localStorage` can fail** (private mode, a full quota, a disabled store). A failed read or
  write MUST NOT throw. The picker then uses session-only behavior: Recent works for the rest of
  the session and does not persist across the next reload.

### 2.7 Palette-relative colors and border color's Invisible step

The engine implements both changes below in `src/engine/` (PR #18,
`feat/engine-refs-and-surfaces`). The owner authorized this one change to the otherwise frozen
API (CLAUDE.md, PLAN §5). M3 and M4 build the real behavior. §6.2 has the build notes. Where a
file and a line are named, they cite the shipped code.

#### Change 1 — palette-relative colors

```ts
type PaletteRef = `palette:${PaletteColorName}`
type SeedColor = Hex | PaletteRef
```

`ThemeConfig.colors.primary/accent/error/warning/success/info` are each a `SeedColor`. A color
picked from an entity-palette swatch follows that preset when the preset changes. A typed or
free-picked color stores a literal hex and never moves. `resolveConfig()`/`derive()` resolve a
`PaletteRef` against the `palette` field of the same config, on every call.
`theme.config.colors.*` always returns the value that the caller passed in (a reference or a
literal). The resolved hex is not in the config.

`NeutralSlotId` is not a member of `SeedColor`. The neutral ramp is not a swatch source in this
popover (§2.2), so no `colors.*` value needs to reference a neutral slot. A reference can name
only one of the 18 entity-palette colors, never one of the four generated ramps (primary, red,
orange, green). The engine generates those four ramps *from* these seed fields, so a reference
into one of them has no fixed point to resolve to before the ramp exists.

Build the popover as §2.2–§2.4 specify. An entity-palette swatch pick writes a `PaletteRef`.

#### Change 2 — border color's Invisible step

`borderColor` has the type `NeutralSlotId | "match-card"`. `--shadow-color` does not share a base
with the border knob.

**`"match-card"` resolves to the literal, already computed `card-background-color` of the current
mode.** It is never a ramp lookup. The engine reads `surface.card` directly when
`config.borderColor === "match-card"`. Any other value places the border relative to the card
(§2.5).

**The border color has alpha `1f`.** `--outline-hover-color` reuses the border color at alpha
`3d`. `mirrorSlot` serves the text, scrollbar and icon code. The border does not use it.

**The dark card is a *joint* function of both surface knobs (below).** In the default config, the
light card is `neutral-100` and the dark card is `neutral-05` (`#141414`). Page `neutral-90` with
card `neutral-100` gives a dark card at `neutral-10` (`#202020`).

**`--shadow-color` always derives from `neutral-05`**, independent of the value of the border
knob and of the mode. Only the alpha changes (`29` light, `7a` dark). `forMode()` in `derive.ts`:
`vars["shadow-color"] = withAlpha(neutral[5], dark ? "7a" : "29")`. This line does not read
`config.borderColor`. The engine follows the block NOTE at `template.css:144`. The per-line
comment at line 148 names `--divider-color` instead. PR #18's body has the full resolution of
that conflict inside the reference file.

#### How `surfaces()` derives the dark pair

The dark surfaces mirror the light surfaces, and each surface keeps its rank. The engine derives
the card, page and secondary backgrounds together, and `"match-card"` reads directly from the
joint result. In the terms of this spec:

1. **Find the positions of the card and the page in the 13-slot neutral ramp.** Call the lower
   position `lo` and the higher position `hi`.
2. **Place the darker dark surface at position `12 - hi`.** This position mirrors the lighter
   light surface.
3. **Place the lighter dark surface at position `12 - lo`.** The gap between the two surfaces is
   the same in both modes. The surface that is lighter in light mode is lighter in dark mode.
   Equal choices sit at the same position (`12 - hi`), and the gap is zero.

Every dark position mirrors a valid light position, so every dark position is between `0` and
`12`. The engine needs no clamp. The default config (page `neutral-95`, card `neutral-100`) gives
a dark page at `neutral-00` (`#000000`) and a dark card at `neutral-05` (`#141414`).

**All arithmetic runs in positions.** The 13 slots of `NEUTRAL_RAMP_SLOTS` have uneven spacing
(`0, 5, 10, 20, … 90, 95, 100`). A subtraction of slot numbers can give a value with no matching
slot, such as `neutral-15`. `surfaces()` works on the position of each slot in the 13-element
array (`0` through `12`).

`--secondary-background-color` sits one position below the darker surface in light mode. In dark
mode, it sits one position above the lighter surface, so it differs from the page and from the
card.

#### The surface name: `"white"` is `"neutral-100"`

`SurfaceChoice` is `"neutral-100" | "neutral-95" | "neutral-90" | "neutral-80"`.
`DEFAULT_CONFIG.cardBackground` is `"neutral-100"`. This is the color `#ffffff` in every preset,
and it is a real ramp slot. Every place in this spec that names "White" as a surface choice (the
four-swatch background rows in §2.5 and §3.2, the allowed-values table in §2.1) means
`"neutral-100"` and reads **Neutral 100** in the UI.

The neutral ramp has two extra slots: `NeutralRampSlot` has 13 shades, `00` through `100`. The
generated primary/red/orange/green ramps share the 11-shade `RampSlot`. Every neutral preset has
real, untinted reference data at both ends: the `black` and `white` rows of
`.references/colors/black-white-ramps.html`, `#000000` and `#ffffff` for all ten presets,
including tinted presets such as Mauve. `NeutralSlotId` has the same two extra entries:
`"neutral-00"` and `"neutral-100"`. **Spell them with the leading zero**, like the existing pad
of `neutral-05`…`neutral-95`. `"neutral-0"` is not a valid id.

The change is scoped to the neutral ramp. `RampSlot`, `Ramp` and `generateRamp()` (the
primary/red/orange/green machinery) do not change, because those four ramps have no reference
data at slots `0`/`100`. A shared type that includes them breaks every `Record<RampSlot, Hex>`
reference ramp at typecheck time. The exported CSS surface does not grow either.
`--ha-color-neutral-00` and `--ha-color-neutral-100` are not theme variables: `template.css`
does not define them, and the engine emits only `05`…`95` for every ramp, neutral included. The
two extra slots feed `cardBackground`, `primaryBackground` and `borderColor` only.

**The "Neutral ramp" preview section (§4.4) shows eleven swatches.** The Compare all dialog (§3.3) shows thirteen.
`DerivedTheme.ramps.neutral` has the 11-shade shape. The engine narrows it from the 13 shades of
the preset, so that swatch-row consumers do not need a special case for the two extra ends.
The line "no black or white endpoints" in §4.4 is accurate. The **Compare all base tones** dialog
(§3.3) is the one place that shows all thirteen shades. §3.3 gives the reason.

---

## 3. Knob sidebar IA

### 3.1 Structure

The sidebar has five groups. **All groups stay open**, in one scroll. Group headings are sticky
within the sidebar scroll container (small uppercase, muted, with a `Separator` above). All
twelve knobs are visible without a click. Because of this, the user sees that a change of base
tone also moves the surfaces. A sidebar scroll of 1300px is acceptable on a desktop tool (§7.1).

### 3.2 Groups, order, controls

Labels in `code` are verbatim from `template.css`. You MUST use them as written.

---

**1 · Typography**

| Label | Control | Writes | Default (`DEFAULT_CONFIG.fonts`) |
|---|---|---|---|
| `Body font family` | Grouped `Select` | `fonts.body`, `fonts.heading`, `fonts.longform` | `"roboto"` |

**v1 has one font knob (owner decision, §7, O-9).** The Heading, Longform and Code knobs are
planned for a later version. §7.3 has the full decision.

**The Body knob writes three fields.** A pick sets `fonts.body` **and** `fonts.heading` **and**
`fonts.longform` to the same font id in one store update. `fonts.code` stays at
`DEFAULT_CONFIG.fonts.code` (`"system-mono"`), and no control writes to it in v1.

**Why the Body pick also sets Headings and Longform.** Home Assistant falls back to Roboto for
every `--ha-font-family-*` variable that a theme does not set (`typography.globals.ts:6-8`). A
theme that sets only `--ha-font-family-body` puts Roboto under a DM Sans body. This app must not
ship that mismatch. The default stylesheet of HA keeps the two in step:
`--ha-font-family-heading: var(--ha-font-family-body)` (`typography.globals.ts:27`). This app
follows the same rule and writes the literal font id to both engine fields, so the exported YAML
states both explicitly.

**Why Code keeps its own value.** A body-driven `--ha-font-family-code` sets code blocks and
entity IDs in the face that the user picked, a display serif included. The default of HA is the
plain CSS keyword `monospace` (`typography.globals.ts:7`). `DEFAULT_CONFIG.fonts.code` already
resolves to the same stack (`presets/fonts.ts`, `id: "system-mono"`, `stack: "monospace"`). The
export keeps this value fixed in every theme and needs no control.

**The engine needs no change and no new type.** `ThemeConfig.fonts` keeps its four fields:
`body`, `heading`, `longform`, `code`. Do not add a type for "the fonts a user can pick" and
"the fonts a user cannot pick". One `FontId` union covers all four fields, and the store writes
plain `ThemeConfig`. §6.2 item 10 repeats this for the M4 build.

The engine's `FONTS` array, grouped by `FontOption.category`, builds the dropdown.
`FONT_CATEGORY_LABELS` supplies the group headings. **Do not hardcode the list or the group
names.** The engine owns both. The key order of `FONT_CATEGORY_LABELS` is the order of the groups
in the dropdown:

| Group heading | Items (`FONTS`, in array order) |
|---|---|
| **Sans-serif** | Roboto, Inter, Figtree, DM Sans, Nunito Sans, Manrope, Outfit, Rubik |
| **Serif** | Source Serif 4, Lora, Merriweather, Bitter |
| **Display serif** | Fraunces, Playfair Display |
| **Monospace** | JetBrains Mono, IBM Plex Mono |
| **System** | System sans, System serif, System mono |

The list has 19 items. **System is the last group.** The engine's order and wording are
authoritative. Every `SelectItem` and `SelectLabel` MUST sit inside a `SelectGroup` and never
directly in `SelectContent` (shadcn composition rule).

**Each `SelectItem` MUST render in its own typeface** at 15px. This is the entire preview for
this knob, and it justifies loading the sixteen webfonts into the builder. The set to load is
exactly `FONTS.filter(f => f.needsWebfont)`. Load the fonts from Google Fonts at 400/500/700 with
`display=swap` in the builder's own `index.html`. This loading is builder-side only and
independent of the exported theme. The exported theme has its own `extra_module_url` snippet,
driven by `theme.webfonts` (§1.4).

Helper text under the row: *"Most of the UI: labels, buttons, entity names, headings and long
text. Code stays monospace."*

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
The text is true for primary, error, warning and success. Accent and info are standalone values
with no ramp.

---

**3 · Base tone** — the neutral ramp preset picker. `Label: "Base tone"`.
Config field `neutralRamp: NeutralRampId`, default `"ha"`. The options are `NEUTRAL_RAMPS` (§3.3).

Group helper text: *"Every background, border and text color comes from this ramp."*

---

**4 · Surfaces** — the three constrained knobs (§2.5), in this order:

| Label | Config field | Control | Default |
|---|---|---|---|
| `Card background` | `cardBackground: SurfaceChoice` | 4-swatch row | `"neutral-100"` |
| `Primary background` | `primaryBackground: SurfaceChoice` | 4-swatch row | `"neutral-95"` |
| `Border color` | `borderColor: NeutralSlotId \| "match-card"` | mini-card list, 5 named steps (§2.5) | **`"neutral-05"`** — the **Strong** step |

`SurfaceChoice` is `"neutral-100" | "neutral-95" | "neutral-90" | "neutral-80"`. `NeutralSlotId`
is `"neutral-00"` … `"neutral-100"` (§2.7). The border knob also accepts the `"match-card"`
sentinel (§2.7). `SurfaceChoice` and `NeutralSlotId` come from `src/engine/types.ts`. The control
options for Card background and Primary background are the union members. Do not hand-write
the list. The five named steps of Border color are a UI-only subset of the same union plus one
sentinel value. §2.5 gives the four slots, and §2.7 gives the sentinel.

The border default is the **Strong** step (`neutral-05`), the most visible of the four named
steps. In light mode, `--divider-color` is `neutral-05` at `1f` alpha. This gives the `#0000001f`
of `template.css` a tint from the ramp.

---

**5 · Entity colors** — the extended palette preset picker.
`Label: "Entity colors"`. `template.css` writes `"Home Assistant colors"`. The sidebar label is
"Entity colors" for clarity (§7, O-2). `EXTENDED_PALETTES` and the CSS variables that the knob
feeds keep their names. Only the sidebar label differs.
Config field `palette: ExtendedPaletteId`, default `"ha"`. The options are `EXTENDED_PALETTES`
(§3.3).

Group helper text: *"These color entity icons and badges — a light is amber, a lock is red."*

---

**Ordering rationale.**

- Fonts come first: they give the fastest visible change at zero risk, and they match
  `template.css`.
- Brand colors come second: most users come here to change them.
- The neutral system and the surfaces built on it follow, adjacent to each other, so that their
  interaction is visible.
- The extended palette comes last: its eighteen values affect only entity icon colors, the
  smallest effect of any group.

### 3.3 Comparing 10 ramps and 8 palettes

A dropdown of names ("Zinc", "Stone", "Mauve") does not tell the user anything. Both preset pickers use
the same pattern:

**A vertical list of named color strips, one row per preset, with radio semantics.**

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
      … 10 rows, 34px each = 340px
```

The strip is the label. The stack of strips is the comparison: all ten strips have identical
width and align on the same step boundaries. The warm cast of Stone against the blue cast of
Slate is then visible at a glance. A name or a single swatch cannot give the reader this
information. The extended palette picker is the same component with eighteen segments per row
and eight rows.

**The engine data, in engine array order and with engine labels, renders both lists.** Do not
hardcode names and do not reorder for aesthetics:

| Picker | Source | Order (ids) |
|---|---|---|
| Base tone | `NEUTRAL_RAMPS` → `.ramp`, 11 slots via `rampEntries` | `ha`, `rounded`, `slate`, `gray`, `zinc`, `stone`, `mauve`, `olive`, `mist`, `taupe` |
| Entity colors | `EXTENDED_PALETTES` → `.colors`, keyed by `PALETTE_COLOR_NAMES` | `ha`, `tailwind-v3`, `tailwind-v4`, `material-accent`, `ant-design`, `chakra-ui`, `bulma`, `rounded` |

`preset.label` of the eight Tailwind-derived ramps has a suffix, for example **"Stone
(Tailwind)"**. **The sidebar list strips the suffix.** It renders "Stone", because a 300px row does not need the provenance eight times (§7, O-8). **The
compare-all dialog keeps the full `preset.label`**, suffix included, because that view is the
place for provenance. Strip only the pattern `" (Tailwind)"` at the end of the label. Do not
change `preset.label` itself, the ids, or the sort order. The transform is a display transform
in the UI layer only. The engine label does not change. The ramp swatch order is
`rampEntries()`: slots 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, from dark to light. The
strips have black and white endpoints only in the compare-all dialog (see below). The palette
swatch order is `PALETTE_COLOR_NAMES`. Palette labels have no such suffix and stay unchanged.

Implementation: `RadioGroup` / `RadioGroupItem` with the visual indicator suppressed and the
strip rendered as the `Label` content. The selected row has a 2px ring in the builder's accent
and a filled radio dot. Base UI provides full keyboard support (`↑`/`↓` moves and selects).

**A "Compare all" option.** A text button under each list opens a `Dialog` at 1100px. The dialog
needs a real `DialogTitle`, and `sr-only` hides it visually. It holds the reference-table view:
rows are steps and columns are presets, exactly as in `.references/colors/*.html`. A click on a
column header selects that preset and closes the dialog. The data is already available, so the
dialog costs little. It serves the user who wants to read individual hexes. The strips serve
visual comparison.

**The table of the Base tone dialog has thirteen rows.** The sidebar strip and §4.4 show eleven. Read it from the raw preset
(`getNeutralRamp(id).ramp`, the 13-shade `NeutralRamp`, §2.7). Do not read it from
`theme.ramps.neutral`. The engine narrows that field to eleven shades on purpose (§6.1, item 8),
so it does not carry the `00` and `100` rows that this dialog needs. The extra rows sit exactly
as `black-white-ramps.html` shows them: `neutral-00` above `neutral-05` and `neutral-100` below
`neutral-95`. The rule "exactly as in `.references/colors/*.html`" above applies here too. This
dialog is the one place in the spec that shows all thirteen shades. The sidebar strip and the
§4.4 **Neutral ramp** preview section stay at eleven. The Entity colors dialog has eighteen
columns and no such row.

The presets are raw color data. The comparison renders them on the neutral surface of the
builder.

---

## 4. Preview content audit

The review of the artifact found it "directionally right, a bit too detailed". The detail is of
three kinds, and the preview omits all three:

- **Editing controls inside the preview** (`<input type="color">` on swatches, ramp-link
  `<select>`s, "reset" links). **Cut everywhere.** The sidebar is the only control surface.
- **RGB tuples under every swatch.** **Cut everywhere.** The engine omits `rgb-*` companions from
  the YAML where HA derives them from hex (PLAN M1). Nobody copies this number, and nothing
  exports it. It is noise.
- **CSS variable names under every swatch.** **Cut everywhere**, Surfaces and Text included
  (§7.1). The preview renders the result. §4.1 and §4.2 name the variable
  of each tile once, in prose. The sections do not repeat it on every tile.

### 4.1 Surfaces & dividers — **keep, trimmed**

| Artifact | Verdict |
|---|---|
| 4 tiles, 200px, each with its surface color | **Keep** — tiles at 180px, 2×2 within each panel |
| Label + `--var-name` | **Keep the label. Cut the variable name.** |
| `hex · rgb` | **Trim** to hex only |
| Ramp-link `<select>` | **Cut** |
| `reset` link | **Cut** |
| 2px offset outline ring on each tile | **Cut** — it is decorative. A 1px hairline border in `--divider-color` is enough, and it is itself a token that the preview shows |

The four tiles are `--primary-background-color`, `--card-background-color`,
`--secondary-background-color`, `--divider-color`. The divider tile MUST render as a *card with a
hairline rule across it*. A solid block of a 12%-alpha value misleads
the reader about the function of the knob.

### 4.2 Text → **rename "Text & type", keep + one addition**

| Artifact | Verdict |
|---|---|
| 3 × "The quick brown fox" in primary / secondary / disabled | **Keep** |
| `--var-name` | **Cut** |
| `hex · rgb` | **Trim** to hex |
| Ramp-link `<select>`, `reset` | **Cut** |

**Font preview.** The **Body** font renders in the "Living room" applied demo (§4.6): entity
names, labels and buttons in a Home Assistant dashboard all take `--ha-font-family-body`. v1 has
only the Body knob (§3.2, §7.3), and it also drives `--ha-font-family-heading`. The demo
therefore previews the one font choice that a user can make. This matches a real `ha-card`:
`.card-header` reads `font-family: var(--ha-card-header-font-family, inherit)` (`ha-card.ts:43`).
Neither `template.css` nor the engine sets `--ha-card-header-font-family`, so a card header
renders in the ambient body font, with or without a separate Heading knob.

**Longform and Code need a dedicated specimen.** No text in any preview section takes
`--ha-font-family-longform` or `--ha-font-family-code`. This applies to every section, the
"Living room" demo and its M5 second card included. No section holds a long text block or a code
string. `--ha-font-family-longform` is not a knob in v1. It tracks Body, like Heading. Its own
line length and rhythm at the longform size appear only in a longer paragraph, which no other
section provides. `--ha-font-family-code` stays fixed at the default monospace stack of HA
regardless of the Body pick (§3.2). Only a code line that does not move when Body changes
proves this fact.

Extend this section with a short type specimen inside the same card:

- a heading-size line in the Body face. `--ha-font-family-heading` tracks
  `--ha-font-family-body` (§3.2), and this line shows the pair at its real size and weight
- a sentence in `--ha-font-family-body`
- a two-line paragraph at the longform size, also in the Body face. `--ha-font-family-longform`
  tracks the same knob
- a single code line in `--ha-font-family-code` (for example, `sensor.living_room_temperature`),
  fixed at a monospace stack and independent of the Body knob

Each line carries its role in small muted text. This specimen is the only place where a reader
sees the full type hierarchy of the theme at once. It is also the only place that shows that
Code does not follow Body.

### 4.3 Brand & status — **keep, restructured**

| Artifact | Verdict |
|---|---|
| 6 pills: color circle, label, var name, hex | **Keep the set of six** |
| The color circle as an `<input type="color">` | **Cut** — this is the core mistake of the artifact |
| `reset` link, rgb tuple | **Cut** |

**Restructure**: render each pill as a **filled chip**. The color is the background, and the
label renders on it in `--text-primary-color`. The most important derived value in this system
is "is the text on the primary color legible". The chip makes the answer visible and does not
only report it. The hex sits below the chip in muted mono.

**Every chip label takes `--text-primary-color`.** Home Assistant computes an on-color for the
primary color only. Every other chip reuses that value. The HA source confirms this:

- The notification badge in `ha-sidebar.ts` sets `color: var(--text-accent-color,
  var(--text-primary-color))`. `color.globals.ts` does not define `--text-accent-color`, so the
  fallback always applies.
- `color.globals.ts:288` sets `--mdc-theme-on-secondary: var(--text-primary-color)`. Secondary is
  the accent color.
- A real screenshot (`home-assistant.io`,
  `source/images/integrations/repairs/number-of-repairs.png`) shows a white numeral on the orange
  accent badge. White is the default of `--text-primary-color` (`color.globals.ts:10`).
- The `--ha-color-*` layer agrees. `semantic.globals.ts` sets every `--ha-color-on-*-loud` value
  to `var(--white-color)`, in light and dark mode, except `--ha-color-on-disabled-loud`.

A small warning glyph appears on any chip whose label fails **3:1** contrast, with a `Tooltip`
that names the ratio. Compute the ratio with the engine's own `contrastRatio`. Do not write your
own. The warning is non-blocking (§5.3).

**There are two thresholds. Do not confuse them.** The engine picks *which* text color goes on
the primary color with `contrastingText()`. That threshold is **6**, because HA uses 6. See
`derive.ts` and the engine README. The analysis doc §7.5 says 4.5, and that value is wrong. The
*warning* to the user is a separate function, and it uses **3**, the WCAG AA level for large text
(owner decision). Each chip label renders at a large size. The warning appears when even the text
color that Home Assistant chooses is hard to read. The value 6 selects the text color, and the
value 3 raises the warning. A chip can pass the selection and still raise the warning.

Home Assistant reuses one on-color for every chip. A color can therefore fail 3:1 against the
shared on-color, although a color-specific computation would pick a passing on-color. Under
`DEFAULT_CONFIG`, `--text-primary-color` is `#ffffff`. Against it, Accent scores 2.16:1 and
Warning scores 2.21:1, and both fail 3:1. Primary (3.26:1), Error (4.59:1), Success (3.00:1) and
Info (3.08:1) pass. The result is the theme of Home Assistant itself, rendered honestly, and the
builder introduces no defect.

The artifact has a numeric "vs list row: 3.2" contrast readout. The preview omits it. A HA user
has no calibration for a ratio. The illegible text carries the same information, and the user
reads it instantly.

### 4.4 Neutral ramp — **keep the strip, cut the metadata. Full width**

| Artifact | Verdict |
|---|---|
| 11 swatches in a row | **Keep** — this is the section, and it gets the full preview width |
| Step name under each (`05`, `10`, …) | **Keep** |
| `--neutral-05` under each | **Cut** — the step number is the name |
| hex | **Keep**. It moves to a tooltip below 28px per swatch (§1.5) |
| rgb | **Cut** |
| Description that mentions "tune warmth and tint in Tweaks" | **Rewrite** — v1 has no such control. New copy: *"The base of the theme. Every background, border and text color is a step on this ramp."* |

The section renders **once, full width, tagged `Both modes`** (§1.2).

### 4.5 Extended palette → **"Entity colors". The largest cut**

The artifact renders nineteen cards. Each card holds a tint tile with a color dot, a label, a var
name, a contrast row, a hex, and sometimes a ramp-link select. That is six pieces of chrome per
color, and 114 in total. This group of values tints mostly entity icons.

| Artifact | Verdict |
|---|---|
| Card chrome around every hue | **Cut** |
| Tint tile + inset dot construction | **Cut** — one flat swatch |
| `--{name}-color` under each | **Cut** — the label is the name |
| `vs list row` contrast readout | **Cut** |
| Ramp-link `<select>` for the greys | **Cut** |
| The `light-grey` / `grey` / `dark-grey` trio | **Cut from this section** — they are neutral ramp aliases, and §4.4 already shows them. Exactly 18 hues remain. |
| hex | **Keep**, muted mono under the name |

Result: a flat grid of **18 named swatches, 6 across, full width**, tagged `Both modes`. Section
description: *"These color entity icons and badges — a light is amber, a lock is red."*

This is the largest reduction in the audit: 114 elements become 36.

### 4.6 Applied demo → **"Living room". Keep, promote to first, extend**

The room card is the best part of the artifact, and it needs the least work. It has five entity
tiles, a brightness slider, and a room header with temperature and humidity. It already renders
in both modes. **Keep it essentially as it is.** Rename the section to `Living room`. It is a
dashboard, so it takes the label of a dashboard.

The room card exercises: card background, primary background, divider, both text colors, primary,
and the border radius. It does not exercise error / warning / success / info or the extended
palette. It does not exercise Longform or Code either. The room header MUST render in
`--ha-font-family-body`, because it copies the `ha-card` header rule of Home Assistant (§4.2 has
the citation). This header also stands in for `--ha-font-family-heading`, because the single
font knob of v1 sets both to the same value (§3.2). Do not set the header to a different
variable than the rest of the card. That would render a font pairing that the real exported
theme never produces.

M5 adds **one second card** below the room card, in the same two-panel grid:

- a row of four entity icons in extended-palette colors (amber light, red lock, blue climate,
  green sensor). It proves that the palette knob has a visible effect
- a primary `Button` and a secondary `Button`. They prove `--text-primary-color` on
  `--primary-color`
- one entity row in the disabled/unavailable text color

The Living room section has no alert or status card. A dashboard shows these only when an entity
or a card configuration is broken. The Brand & status chips (§4.3) show the error, warning,
success and info knobs.

Every icon is an MDI path from `@mdi/js`, the icon set of Home Assistant.

Everything in the Living room section MUST be built from theme variables, with zero hardcoded
colors (M5 acceptance criterion). The one exception is the slider thumb. Home Assistant
hardcodes it `white` in both modes (`ha-control-slider.ts`), so the demo does the same.

### 4.7 Generated values — **cut as a section**

The export `Sheet` (§1.4) holds the YAML. The preview has no live YAML panel and no counter
(§7, O-4).

### 4.8 Also cut

- The **light/dark toggle button** of the artifact in the header, which switched the mode of the
  *preview* (PLAN §3 decision 4). The preview has no mode state of its own. Light and dark render
  side by side, always. The light/dark/auto toggle of the app bar (§1.1) is a different control
  for the builder's own chrome only. See §1.1 for the full distinction.
- The **"Tweaks" panel** concept (warmth/tint/L/C sliders). v1 has presets only (PLAN §3.6).
- The **footer paragraph** of the artifact about methodology.

---

## 5. Empty and edge states

### 5.1 First load

**There is no empty state.** The page loads `derive()` with no arguments, that is
`DEFAULT_CONFIG`. Every knob has a value, every preview section renders, and the Export button
is enabled.

That default is **Home Assistant Refined**, a redesign of the theme that HA ships today. PLAN §3
decision 9 (✅ 2026-08-11) defines it. `template.css` is a redesign. 40 variables per mode differ
from stock, and the product models only the refined theme. The UI MUST NOT call the load state
"the Home Assistant default". It is the starting point. Stock HA is an M7 starter preset.

Consequences for copy, all of them MUST:

- The reset button reads **"Reset to defaults"**.
- The UI does not claim that the untouched export matches a stock HA install.
- The theme name field starts at `DEFAULT_CONFIG.name` = **`My Theme`** (§1.4).

The only first-load affordance is one line under the app title:
*"Turn the knobs on the left. Everything updates live, in light and dark at once."*
The line stays visible and sits inline under the app title. **Reset to defaults** is disabled until at least one
knob differs from `DEFAULT_CONFIG`.

### 5.2 Loading state

The loading state does not exist. The engine is synchronous and runs on the client. The UI has
no spinners, no skeletons and no "generating…". If a knob change takes long enough to need one,
that is an engine bug. Webfont loading is the one asynchronous process.
`display=swap` handles it, and no UI acknowledges it.

### 5.3 Extreme color choices

The rule: **warn, never block.** It is the user's theme.

| Situation | Behavior |
|---|---|
| Text on a brand/status color falls below 3:1 | A warning glyph on that chip in the preview (§4.3) **and** a warning row at the bottom of the popover of that knob. Both name the problem in plain words and name Home Assistant as the source of the low contrast. |
| A brand color is so light or dark that its generated ramp clips at one end | No special UI. The engine clamps. The ramp preview renders the flattening honestly. |
| Secondary text falls below 4.5:1 on the card background in either mode | One warning row under the **Base tone** group: *"Secondary text is low contrast in dark mode with this base tone."* |
| Card background = Primary background (both Neutral 100, or both Neutral 95) | Allowed. The Surfaces preview renders the two tiles as identical. That is the honest feedback. No warning. |
| Invalid hex typed | §2.4 — the field shows an error and the value stays unchanged. |

Warnings are `Alert variant="default"` with a `TriangleAlert` icon and muted styling. They are
informational. A warning is never a toast. Toasts report things that already
happened.

### 5.4 Cross-knob interactions

- **A change of the base tone** re-renders the three Surfaces controls, the ramp preview
  section, and every preview panel. The constrained knobs (border, card background, primary
  background) store a *reference* to a ramp step, so they follow the new ramp automatically. The
  change has no effect inside an open color popover, because the popover does not offer
  neutral-ramp swatches (§2.2).
- **Brand and status colors (§2.7 Change 1):** a color picked from the entity palette follows
  that preset when it changes. A typed or dragged color stores a literal hex and never moves.
  Build this behavior. A `PaletteRef` and a literal hex are both plain strings, and
  `ThemeConfig.colors.*` accepts both.
- **A change of the extended palette** re-renders the palette swatch group in open popovers and
  the §4.5 section. It does not change any other knob.
- **Reset to defaults** opens an **`AlertDialog`**, because it is a
  destructive confirmation (the plain `Dialog` serves Compare all, §3.3). It also clears the Recent list from `localStorage` (§2.6) and not
  only from memory.

---

## 6. Notes to implementers

### 6.1 For M3 — preview pane

1. Build the two-column grid first. The grid has no column header, sticky or not (§1.2), and
   every section fits straight into the grid. Sections that render once span both columns
   (`col-span-2`) and carry a `Both modes` `Badge`.
2. **Scoped variables only.** Set the generated CSS custom properties with
   **`toCssProperties(theme, mode)`** on the light panel container and on the dark panel
   container. The function returns `--`-prefixed keys and merges `common` with the overrides of
   that mode, so your code never touches `theme.light` / `theme.dark`. Those two are *disjoint*
   partial maps, and `theme.light` alone lacks every mode-independent variable. Use `modeVars` if
   you need the same map with bare keys.

   ```ts
   for (const [prop, value] of Object.entries(toCssProperties(theme, "light"))) {
     lightPanelEl.style.setProperty(prop, value)
   }
   ```

   **Never set the properties on `:root` or `document.documentElement`.** The builder's own
   shadcn/Tailwind theme lives there, and the preview must not change it (analysis §7.7,
   CLAUDE.md).
3. Preview components style themselves **exclusively** with `var(--ha-*)` and legacy theme
   variables. Tailwind color utilities inside a preview panel are bugs: `bg-white`,
   `text-neutral-500` and `border-gray-200` are examples. Layout utilities (`flex`, `gap-4`,
   `grid`) are allowed.
4. Preview components are **read-only**. They contain no `<input>`, no `<select>`, and no click
   handlers that change theme state. The mock UI *inside* the applied demo (M5) is the one
   exception. A toggle or a slider there can be visible, but it MUST be inert (`aria-hidden`
   where appropriate, `pointer-events: none`, `tabIndex={-1}`), so that it never enters the tab
   order.
5. The section order is §1.3. The section chrome (label + rule + description) is one shared
   component.
6. Do not optimize with memoization in advance. A re-render of the whole preview on a knob
   change is acceptable at this size. If it is too slow, memoize at the section boundary.
7. The user can set `--divider-color` to fully transparent, or `--primary-background-color` to
   white. The preview panels MUST still render correctly in both cases. Panel separation must not
   depend on a theme variable alone. Give each panel a fallback outline in the *builder's* border
   color.
8. The **Neutral ramp** section renders `theme.ramps.neutral` through `rampEntries()`. It does
   not render the raw preset (`getNeutralRamp(id).ramp`). The two have different shapes:
   `theme.ramps.neutral` is the 11-shade `Ramp` (`05`…`95`) that `rampEntries()` expects, and the
   raw preset is the wider 13-shade `NeutralRamp` (`00`…`100`, §2.7). Do not pass the raw preset
   to `rampEntries()`, because it does not accept the wider shape. The **Entity colors** section
   reads the palette values from `modeVars(theme, "light")` under the `{name}-color` keys, in
   `PALETTE_COLOR_NAMES` order.

### 6.2 For M4 — knob sidebar

0. **The store shape is `ThemeConfig`, verbatim.** Do not invent a parallel UI state shape. Every
   knob writes one field of the engine config, and the whole config is JSON-serializable.
   `resolveConfig()` and `DEFAULT_CONFIG` then provide the load state and the "is it dirty?"
   comparison. Field names and option unions are in §3.2 and `src/engine/types.ts`. `derive()`
   throws `TypeError` on a malformed seed hex. It throws `RangeError` on an unknown font, ramp or
   palette id. It never substitutes a value silently. The hex field must therefore validate
   before it commits (§2.4). Read preset ids from the preset arrays and never from a string
   literal.
1. Twelve knobs, five groups, §3.2. Labels are verbatim from `template.css`.
2. **Zero `<input type="color">`.** Search for it with grep before you open the PR.
3. Three distinct color controls: popover picker (×6), inline mini-card list for Border color
   (×1, five named steps, §2.5), inline 4-swatch row (×2). §2.1.
4. The entity-palette swatch group of the popover reads from the *current* palette preset in the
   store. It is derived state that updates when the preset changes. The popover has no base-tone swatch
   group (§2.2), so a base-tone change behind an open popover does not change anything inside that
   popover. To check the palette group, open a popover, change the entity-palette preset in the
   sidebar behind it, and check that the swatch group updates.
5. Hex commits on Enter and on blur (§2.4).
6. Each Border color mini-card renders a real `1px solid ${rampHex}1f` border over the own card
   background of that half. It does not use a precomputed blend. The browser composites the
   result live (§2.5).
7. Font `SelectItem`s render in their own typeface. The list, its grouping and its order all come
   from `FONTS` + `FONT_CATEGORY_LABELS` and never from a hardcoded array (§3.2). Load
   `FONTS.filter(f => f.needsWebfont)` in the builder's `index.html`.
8. Roving tabindex on every swatch group. This is the only non-trivial a11y work in M4, and it
   is an acceptance criterion. The Base UI `RadioGroup` provides it. Prefer it over a manual
   build.
9. A knob change updates the preview immediately. Debounce only the drag on the saturation
   square, to 16ms or one `requestAnimationFrame`. Every other change is discrete.
10. **The Typography group is one control (§3.2, §7.3, O-9).** The `onValueChange` of the Body
    `Select` writes the same font id to `fonts.body`, `fonts.heading` and `fonts.longform` in one
    store update. `fonts.code` stays unchanged, and no control writes to it in v1. Do not add a
    `Collapsible`, a **More** trigger, or a fifth `ThemeConfig` field for this. `ThemeConfig.fonts`
    already has the four fields it needs.
11. `ThemeConfig.colors.*` is `SeedColor` (§2.7, Change 1). Build the "picked color follows its
    preset" behavior: a click on an entity-palette swatch writes a `PaletteRef` (`"palette:red"`), and the engine resolves it again against the current palette on every
    `derive()` call. A typed or free-picked color writes a literal hex and never moves. The
    picker code does not need to know which case applies. It commits the string that the swatch
    or the hex field produces, and `ThemeConfig` accepts both.
12. Recent colors persist to `localStorage` per §2.6. Read, prune and write on the schedule of
    that section. If `localStorage` throws, use the session-only behavior.
13. `borderColor` is `NeutralSlotId | "match-card"` (§2.7, Change 2). Build all five named steps,
    Invisible included. Invisible writes the literal string `"match-card"`. The picker never
    computes a card-matching hex. The engine computes it from the already current
    `card-background-color`. `--shadow-color` does not read this knob, so the shadow of the
    mini-card (§2.5) needs no special case for Invisible. The same fixed base and alpha apply to
    every step.

### 6.3 shadcn components expected

**This is a Base UI project.** `.claude/skills/shadcn/rules/base-vs-radix.md` lists the differences from Radix. `components.json` pins
`"style": "base-nova"`, the components import from `@base-ui/react/*`, and `radix-ui` is not a
dependency. Consequences:

- Composition uses the Base UI `render` prop (the Radix equivalent is `asChild`; see `base-vs-radix.md`).
- `onOpenChange(open, details)` with `details.cancel()` replaces `onInteractOutside`.
- Toasts use `toast` (the registry also contains `sonner`, which this project does not use).

Read the `shadcn` skill before you write UI.

**Install components with the CLI only:** `pnpm dlx shadcn@latest add <name>`. Never hand-write
or hand-port a component (CLAUDE.md). Edits to `src/components/ui/` after the install are
allowed. State them in the PR.

Already in the repo: `button`, `card`.

To add. Every component returned 200 from
`https://ui.shadcn.com/r/styles/base-nova/<name>.json` on 2026-08-11 (§6.4):

| Component | Used for |
|---|---|
| `popover` | Color picker (§2.2) |
| `toggle-group` | The Auto/Light/Dark mode toggle of the app bar, single-select, three items (§1.1) |
| `input` | Hex field, theme name |
| `label` | Every knob |
| `field` | *Recommended* wrapper for a knob row: `FieldLabel` / `FieldDescription` (the helper text) / `FieldError`. It replaces a hand-built label + help + error stack in all twelve knobs. It pulls in `label` and `separator`. |
| `select` | Font dropdown (`SelectGroup` + `SelectLabel` required) |
| `radio-group` | Ramp picker, palette picker, all swatch groups (`RadioGroup` + `RadioGroupItem`) |
| `dialog` | "Compare all" tables — needs a `DialogTitle` |
| `alert-dialog` | Reset confirmation (destructive → `AlertDialog`) |
| `sheet` | Export panel. Sidebar below 1024px — needs a `SheetTitle` |
| `tabs` | Export sheet (`TabsTrigger` inside `TabsList`) |
| `tooltip` | Swatch hex on hover/focus |
| `separator` | Sidebar group dividers (never a raw `<hr>` or bordered `<div>`) |
| `scroll-area` | Sidebar, YAML block |
| `alert` | Contrast warnings, install instructions (`AlertTitle` + `AlertDescription`) |
| `badge` | `Light` / `Dark` / `Both modes` tags (never a hand-styled `<span>`) |
| `toast` | "Copied to clipboard" — the Base UI toast. Do not install `sonner`, the Radix/React-Aria choice. The registry also contains it, so take care to install the correct component. |

Third-party dependency to add: **`react-colorful`** (PLAN §3.7). It is not yet a dependency.
Run `pnpm add react-colorful`. The UI needs no other dependency.

Icons: `lucide-react`, already installed. The installed version exports these names:
`CheckIcon`, `TriangleAlertIcon`, `CopyIcon`, `DownloadIcon`, `RotateCcwIcon`,
`ChevronDownIcon`, and, for the mode toggle (§1.1), `SunIcon`, `MonitorIcon`, `MoonIcon`.
(`AlertTriangle` is the old name and still resolves, but prefer `TriangleAlertIcon`.) Icons
inside a `Button` take `data-icon="inline-start"` / `"inline-end"` and **no sizing classes**,
because the component sizes them.

**Do not use:**

- the shadcn `sidebar` block (§1.1)
- `command` / `combobox` for the font picker (nineteen items in five groups do not need search)
- `native-select` (the picker needs per-item typefaces, and a native `<option>` cannot render
  them reliably across browsers)

*Implementer's choice:* `toggle-group` also works for the 4-swatch background rows, and `item`
works for the preset rows. The recommendation is `radio-group` for both, because one pattern
then covers every swatch group in the app. If `toggle-group` is cleaner for the 4-option case,
state this in the PR and do not mix both patterns silently.

### 6.4 Versions checked

Checked on **2026-08-11** against three sources: the live `ui.shadcn.com` registry, the npm
registry, and the installed packages. Check these facts again after a long time has passed.
Do not rely on this document alone for them.

| Thing | Checked |
|---|---|
| `@base-ui/react` | **1.7.0**, installed. `radix-ui` is not a dependency. `PopoverRootChangeEventDetails` carries `reason` (one value is `"outsidePress"`), `event` and `cancel()`. The refinement in §2.3 uses those three. |
| shadcn style | `components.json` → `"style": "base-nova"`. All 17 components in §6.3 return 200 from `https://ui.shadcn.com/r/styles/base-nova/<name>.json`. `radio-group` exports `RadioGroup`, `RadioGroupItem` from `@base-ui/react/radio{,-group}`. `popover` exports `Popover`, `PopoverContent`, `PopoverDescription`, `PopoverHeader`, `PopoverTitle`, `PopoverTrigger`. There is **no `PopoverAnchor`**. |
| `toggle-group` | Checked **2026-08-14**, for the mode toggle of the app bar (§1.1). Returns 200 from `.../base-nova/toggle-group.json`, with a `toggle` registry dependency that the CLI installs with it. Exports `ToggleGroup`, `ToggleGroupItem` from `@base-ui/react/toggle-group` and `@base-ui/react/toggle`. It needs no new npm dependency and uses the same `@base-ui/react` 1.7.0. |
| `react-colorful` | **5.8.0**, published 2026-07-13, **not yet a dependency**. Peer deps `react >=16.8.0`, so React 19 works. Exports whole pickers only (`HexColorPicker`, `HexColorInput`, …) and **no** saturation/hue sub-exports. Arrow keys move in 5% steps. Interactive areas are `tabIndex=0` `role="slider"` with `aria-valuetext`. `aria-label` is hardcoded `"Color"`. `validHex` accepts 3- and 6-digit hex. |
| `lucide-react` | **1.31.0**, installed. `TriangleAlert` and `TriangleAlertIcon` are both exported. The other icons have the same dual naming. |
| `culori` | **4.0.2**, installed. It is the only dependency of the engine. The UI does not need to import it directly. The color helpers that the UI needs (`contrastRatio`, `normalizeHex`, `isHex`, `withAlpha`, …) are re-exported from `@/engine`. |
| Engine facts | `DEFAULT_CONFIG` is in `src/engine/derive.ts`. `FONTS` / `FONT_CATEGORY_LABELS` are in `presets/fonts.ts`. `NEUTRAL_RAMPS`, `EXTENDED_PALETTES`, `PALETTE_COLOR_NAMES` are in `presets/`. Every default, id, label and ordering in §3.2/§3.3 comes from the source. |

On 2026-08-11, the hosts `ui.shadcn.com`, `registry.npmjs.org` and `raw.githubusercontent.com`
were reachable. The local shadcn skill at `.claude/skills/shadcn/` has the composition, icon and
styling rules, including the differences between Base UI and Radix.

---

## 7. Decisions from the owner — 2026-08-14

O-1 to O-9 are decided. Later sections cite a decision as `(§7, O-n)`.

| # | Question | Decision |
|---|---|---|
| **O-1** | Do the three constrained knobs (border, card background, primary background) use the same popover as the other six? | **Inline controls** (§2.1, §2.5). |
| **O-2** | How does the sidebar label the extended palette knob? `template.css` uses **"Home Assistant colors"**. Inside a Home Assistant theme builder, that label reads as "the colors" in general, while the knob sets the eighteen named entity colors. | **"Entity colors."** Every place in this spec that names the knob or its preview section reads "Entity colors" (§1.3, §2.3, §3.2, §3.3, §4.5). The string in `template.css` stays as it is. Only the UI label differs. |
| **O-3** | Does a color picked *from* a palette strip follow the preset when the user changes the preset, or does it stay? | **It follows the preset.** A color picked from a palette swatch follows that preset when the preset changes. The config stores the picked hue. The resolved hex is not in the config. The ramp is not a swatch source for this popover (§2.2), so this decision applies to the palette only. §2.7 Change 1 has the full specification. The engine implements it (PR #18). M3 and M4 build the real behavior. |
| **O-4** | Does the preview keep a permanent live YAML section? | **No.** The export sheet holds the YAML. The **Export theme** button is a plain button and has no "12 variables changed" counter (§1.4). |
| **O-5** | Is the applied demo the **first** preview section, above the token sections? | **Yes** (§1.3, §4.6). |
| **O-6** | Is one dropdown of 19 items acceptable for the font shortlist (PLAN §3, ✅ 2026-08-09: 8 sans, 4 serif, 2 display serif, 2 mono and 3 system)? | **Yes.** One grouped `Select`, each item in its own typeface. O-9 limits v1 to one font knob, **Body font family**. |
| **O-7** | Do Recent colors persist across a reload? | **Yes.** Recent colors persist to `localStorage`, with a 7-day staleness period **per entry**. Each entry carries its own last-used time, and a read drops any entry older than 7 days. Storage key, entry shape and the cleanup point are in §2.6. |
| **O-8** | The ramp picker rows take their labels from `preset.label`, so eight of the ten read **"Stone (Tailwind)"**, "Zinc (Tailwind)" and so on. In a sidebar 300px wide, that suffix takes a third of the row, eight times. Where does the app remove the suffix? | **In the UI.** The sidebar list renders "Stone". The compare-all dialog keeps the full `preset.label`, suffix included (§3.3). The engine label stays as it is, and its API stays frozen. |
| **O-9** | Heading, Longform and Code have no preview surface except a dedicated specimen. Does v1 keep the three knobs? | **v1 does not include them.** The three knobs are planned for a later version. §7.3 has the full decision and the reasons. |

### 7.1 Review decisions — 2026-08-14

The review also decided five points. They are points that need the judgment of the owner and are
not open questions.

| Topic | Decision |
|---|---|
| Preview of the four font knobs | The Body font renders in the applied demo (§4.2). The knobs for the other three fonts (Heading, Longform and Code) lack an organic preview surface. O-9 (§7.3) resolves this: v1 has fewer knobs and does not add more preview. |
| Extended palette cut | The cut is the largest in the audit: 19 cards become 18 flat swatches. **Approved** (§4.5). |
| Contrast readout | The numeric readout is not part of the preview. The on-color chip replaces it (§4.3). The CSS variable name under every preview swatch is cut, Surfaces and Text included (§4). |
| Sidebar length | The sidebar scrolls 1300px with all five groups open. **Approved** (§3.1). |
| `--ha-font-size-scale` | `template.css` has no `KNOB` annotation for it. It is out of v1 (PLAN §3, decision 8). |

### 7.2 Border color — 2026-08-14

The 12%-alpha ramp strip reads as a row of near-identical light greys. It also hides that the
pick drives `--outline-hover-color` and `--shadow-color` in addition to the divider line.

| Part | Decision |
|---|---|
| Render the outcome | Each option is a mini-card with a real card background, a real border and a real shadow. It splits diagonally: light half top-left, dark half bottom-right, both modes visible at once. §2.5 has the anatomy. |
| Four named steps | Hairline / Subtle / Medium / Strong. Each step is darker than the card and darker than the step before it. The steps are UI-only: `borderColor` stays `NeutralSlotId`, and the engine does not change. §2.5 has the slot picks and the rendered evidence. |
| A fifth step, Invisible | It resolves to the chosen card surface, so the border disappears into the card. It needs an engine sentinel and a fix to `--shadow-color`, so that the shadow still renders when the border is Invisible. §2.7 (Change 2) specifies both. |

**One work package, three engine changes (PR #18, `feat/engine-refs-and-surfaces`).** M3 and M4
build all three:

1. `ThemeConfig.colors.*` has the type `SeedColor` (`Hex | PaletteRef`) (O-3,
   palette-relative brand and status colors; §2.7, Change 1).
2. `ThemeConfig["borderColor"]` has the type `NeutralSlotId | "match-card"` (the Invisible
   border step; §2.7, Change 2).
3. `--shadow-color` reads a fixed `neutral-05` as base and does not share its base with the
   border knob. A borderless card can still cast a shadow (§2.7, Change 2).

§6.2 items 11 and 13 tell M3/M4 to build this behavior.

### 7.3 Font knobs — 2026-08-14

The Heading, Longform and Code knobs have no preview surface outside a dedicated specimen. The
fix is fewer knobs.

| Part | Decision |
|---|---|
| Headings, Longform and Code font knobs | **Not part of v1.** Only **Body font family** ships. The other three are planned for a later version. |
| The reach of the Body knob | It writes `fonts.body`, `fonts.heading` **and** `fonts.longform` on every change. `fonts.code` stays fixed. §3.2 has the full mechanics and the citations. |
| Progressive disclosure (**More** / **Less**) | **Not used.** The Body knob is one row (§3.2). |
| `ThemeConfig.fonts` | **Unchanged.** It has four fields: `body`, `heading`, `longform`, `code`. The engine does not change, and no new type is necessary. The engine already carries the fields of the three planned knobs, so their return needs no migration. §6.2 item 10 repeats this for the M4 build. |

**Why the reach is wider than one field.** HA falls back to Roboto for every `--ha-font-family-*`
variable that a theme omits (`typography.globals.ts:6-8`). A theme that sets only
`--ha-font-family-body` puts Roboto under the body face that the user chose, for headings and
long text. HA's default stylesheet keeps Heading in step with Body:
`--ha-font-family-heading: var(--ha-font-family-body)` (`typography.globals.ts:27`). This app
writes the same value to both engine fields explicitly, so the exported YAML states the intent
and does not rely on a fallback.

**Why Code is the one exception.** `--ha-font-family-code` keeps its own fixed value. A
body-driven code font sets code blocks and entity IDs in the face that the user picked, a display
serif included, and that is unreadable for `sensor.living_room_temperature`. The default of HA
is the plain CSS keyword `monospace` (`typography.globals.ts:7`). `DEFAULT_CONFIG.fonts.code`
resolves to the same stack (`id: "system-mono"`, `stack: "monospace"`, `presets/fonts.ts`). The
export keeps this value fixed in every theme.

---

## 8. Summary of differences from the artifact

| | Artifact | This spec |
|---|---|---|
| Control surface | Sidebar **and** in-preview editing | Sidebar only |
| Color input | `<input type="color">` under an opacity-0 overlay | Custom popover, palette-first |
| Light/dark | A toggle button | Two permanent columns |
| Section count | 7 | 6 (5 token + 1 demo) |
| Applied demo position | 6th | 1st |
| Per-swatch metadata | label + var + hex + rgb + select + reset | label + hex (+ var where it matters) |
| Extended palette | 19 cards, 114 elements | 18 flat swatches, 36 elements |
| Export | Section at the bottom | Sheet from the app bar |
| Font preview | None | Type specimen in "Text & type" + the dropdown renders each option in its own face |
| Ramp/palette choice | A `<select>` of names | Ten/eight stacked strips + a compare-all table |
