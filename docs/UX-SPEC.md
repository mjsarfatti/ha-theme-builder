# HA Theme Builder — UX Spec (M2)

> Status: **for sign-off** · Author: Claude (M2) · Last updated: 2026-08-09
> Wireframe: [`docs/wireframe/index.html`](./wireframe/index.html) — open the file directly in a
> browser (no server, no build step). Deliberately low fidelity; it is a communication device, not
> a head start on production code. **Real data:** all ten neutral ramps and all eight extended
> palettes carry their real hex values from `.references/colors/`, because comparing them is the
> decision the wireframe exists to test. Everything else is greybox. It is not wired to the theme
> engine — the preview panels do not recolour, and there is no real colour maths.
> Gates: **M3** (preview pane), **M4** (knob sidebar), and informs **M5** (applied demo) and **M6** (export).

This document is the single source of truth for the v1 UI. M3 and M4 implementers should be
able to build from this alone.

- **MUST** = an acceptance criterion. Not negotiable without a PM decision.
- ***Recommended*** = a suggested implementation route, not a mandate. You have latitude; if you
  pick differently, say so in the PR rather than changing it silently.
- ***Alternative considered*** = rejected on purpose. Do not silently adopt it.

Every library, component and API named here was **verified against the live registry / upstream
source on 2026-08-09** — see §6.4 for exactly what was checked. Re-verify before you build.

---

## 0. The one-sentence design

**Turn a knob on the left, watch your Home Assistant dashboard change on the right — in light
and dark at once — then hit Export.**

Everything below serves that sentence. The three biggest decisions all fall out of it:

1. **The preview is read-only.** The artifact let you edit colours *inside* the preview
   (colour inputs on swatches, ramp-link dropdowns, reset links). That is a second control
   surface competing with the sidebar. Cut entirely. One place to change things: the sidebar.
2. **The applied HA dashboard comes first, not last.** The artifact buries it at position 6.
   For a user who has never thought about design tokens, the dashboard *is* the answer to
   "does this look good"; the token sections are the detail underneath it.
3. **Export is always one click away**, not a section at the bottom of a long scroll.

---

## 1. Layout

### 1.1 Frame

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APP BAR   HA Theme Builder                  [Reset to defaults] [Export] │  56px, fixed
├───────────────┬──────────────────────────────────────────────────────────┤
│ SIDEBAR       │ PREVIEW                                                  │
│ 340px fixed   │ ┌─ sticky column header ───────────────────────────────┐ │
│ own scroll    │ │  ● Light                    │  ● Dark                │ │
│               │ └──────────────────────────────────────────────────────┘ │
│ Typography    │  Living room  ─────────────────────────────────────────  │
│ Brand &status │  ┌──────────────────┐  │  ┌──────────────────┐           │
│ Base tone     │  │  light panel     │  │  │  dark panel      │           │
│ Surfaces      │  └──────────────────┘  │  └──────────────────┘           │
│ HA colors     │  Surfaces & dividers ────────────────────────────────── │
│               │  ...                                                     │
│               │  Neutral ramp ──────────────── [ Both modes ] ─────────  │
│               │  ┌───────────── full-width panel ────────────────────┐   │
│               │  └───────────────────────────────────────────────────┘   │
└───────────────┴──────────────────────────────────────────────────────────┘
```

- The **app bar** is fixed. It holds the product name, a **Reset to Home Assistant defaults**
  button (disabled until something changes), and the primary **Export theme** button.
- The **sidebar** is a fixed-width `<aside>` with its own scroll container. It never collapses
  on desktop and it is never behind an accordion (see §3.1).
- The **preview pane** is the only long scroll. It fills the remaining width.

**Do not use the shadcn `Sidebar` block.** It brings a provider, cookie persistence, a rail, and
collapsible state we do not need. Use a plain `<aside class="w-[340px] shrink-0 border-r">`
wrapping a `ScrollArea`. The Sheet-based mobile fallback (§1.5) is the only collapsing behaviour.

### 1.2 The light/dark rule

**Column 1 is always light. Column 2 is always dark.** One sticky header at the top of the
preview scroll region labels the two columns; every section aligns to the same grid, so the
labels are stated once, not per section.

The rule has exactly one exception, and it is a principled one:

| Section content | Rendering |
|---|---|
| Values that differ between modes | **Two panels**, light left / dark right |
| Values that are identical in both modes | **One full-width panel**, tagged `Both modes` |

The neutral ramp and the extended palette are mode-independent — the same eleven (resp.
eighteen) hex values are emitted for light and dark; only what *consumes* them changes. Rendering
them twice is pure duplication, and it halves the width of the two sections that need width most
(11 and 18 swatches). So those two sections span the full preview width.

Each **panel** is a rounded container whose own background is that mode's
`--primary-background-color`, with a hairline border in that mode's `--divider-color`. The panel
frame is therefore itself part of the preview. Panels in a row are equal width and top-aligned;
they do **not** have to be equal height.

*Alternative considered:* two full-height page columns (all sections stacked inside a Light
column and a Dark column). Rejected — the columns drift out of vertical sync as content heights
diverge, and there is nowhere to put a section title that belongs to both.

*Alternative considered:* diagonally split swatches, half light / half dark. Rejected — clever,
unreadable, and impossible for the applied demo.

### 1.3 Preview section order

1. **Living room** — the applied HA demo (M5)
2. **Surfaces & dividers**
3. **Text & type**
4. **Brand & status**
5. **Neutral ramp** *(full width, both modes)*
6. **Home Assistant colors** — the extended palette *(full width, both modes)*

Section headers are a small uppercase label + a hairline rule spanning the full preview width,
plus a one-line plain-English description of what the section controls. No section is collapsible.

### 1.4 Where export lives

**Export is a `Sheet` sliding in from the right**, opened by the app bar's primary button.
It contains:

- **Theme name** — an `Input`, default `my_theme`, slugified for the YAML key (lowercase,
  underscores). Live-validated: must match `^[a-z][a-z0-9_]*$`.
- **`Tabs`** with two tabs (`TabsTrigger`s inside a `TabsList` — never directly in `Tabs`):
  - **YAML** — the generated theme in a `ScrollArea`'d `<pre>`, with **Copy** and
    **Download themes.yaml** buttons pinned above it.
  - **Install** — numbered steps for pasting into `configuration.yaml`, plus the
    `extra_module_url` font-loading snippet **shown only when a non-system, non-Roboto font is
    selected** (PLAN §3). When all fonts are system or Roboto, that block is absent, not empty.

The sheet is ~560px wide, dismissible with Esc and the backdrop, and MUST carry a `SheetTitle`
(shadcn requires one for accessibility; `sr-only` if you do not want it visible). Copy fires a
`sonner` toast — `toast.success("Copied to clipboard")`.

**The artifact's "Generated values" scroll section is cut.** One home for export, always reachable,
no scrolling to the bottom of a 4000px page to find it.

*Alternative considered:* keep a collapsed YAML block as the final preview section *and* the
sheet. Rejected — two controls doing one job. **Open question O-4** if the owner wants the
always-visible YAML back as a trust signal.

### 1.5 Responsive

Desktop-first. Breakpoints are on **available preview width**, not viewport, where noted.

| Viewport | Behaviour |
|---|---|
| **≥ 1440px** | Sidebar 340px. Preview two columns. All swatch labels + hex visible. |
| **1280–1439px** | Sidebar 320px. Preview two columns. Unchanged otherwise. |
| **1024–1279px** | Sidebar 300px. Preview two columns. **Compact swatch mode**: per-step hex labels in the ramp and palette sections are hidden and moved to a `Tooltip` on hover/focus. |
| **768–1023px** | Sidebar undocks: app bar gains a **Design** button opening the sidebar in a left `Sheet`. Preview full width, still two columns. |
| **< 768px** | As above, plus preview columns **stack** — light panel above dark panel, each full width. The sticky column header is replaced by a `Badge` reading `Light` / `Dark` in each panel's top-left. Both modes remain simultaneously visible; you just scroll between them. |

The two-column preview MUST NOT produce a horizontal scrollbar at any width. Wide content
(the ramp strip, the palette grid) shrinks its swatches; below ~28px per swatch it drops labels
per the compact rule above; it never overflows.

This is not a phone tool. It must not *break* below 768px, but nothing is optimised there.

---

## 2. Colour picker

### 2.1 Which knobs get which control

There are nine colour knobs and they are not the same kind of thing. Giving all nine the same
heavyweight popover would be uniform and wrong.

| Knob | Allowed values | Control |
|---|---|---|
| Primary color | any | **Popover picker** (§2.2) |
| Accent color | any | **Popover picker** |
| Error color | any | **Popover picker** |
| Warning color | any | **Popover picker** |
| Success color | any | **Popover picker** |
| Info color | any | **Popover picker** |
| Border color | a neutral ramp step, at `1f` alpha | **Inline ramp strip** (§2.5) |
| Card background | neutral 80 / 90 / 95 / white | **Inline 4-swatch row** (§2.5) |
| Primary background | neutral 80 / 90 / 95 / white | **Inline 4-swatch row** |

The last three are *choices from a short fixed list*. A list of four options does not need a
popover, a saturation square, or a hex field — it needs four buttons. Putting them inline in
the sidebar removes three popovers and makes the constraint ("you can only pick from the ramp
here") visible instead of discoverable.

**No `<input type="color">` anywhere in the app.** Not as a fallback, not behind an opacity-0
overlay (which is what the artifact does). This is an acceptance criterion for M4.

*Alternative considered:* one uniform popover for all nine. See **Open question O-1**.

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
│ FROM YOUR BASE TONE                        │  3. neutral ramp, 11 steps
│ ▐▐▐▐▐▐▐▐▐▐▐  (one continuous strip)        │
│                                            │
│ FROM YOUR HOME ASSISTANT COLORS            │  4. extended palette, 18 hues
│ ● ● ● ● ● ● ● ● ●                          │     2 rows of 9
│ ● ● ● ● ● ● ● ● ●                          │
│                                            │
│ RECENT                                     │  5. last 8 committed custom colours
│ ● ● ● ● ● ● ● ●                            │
├────────────────────────────────────────────┤
│ PICK A COLOR                               │  6. free picker
│ ┌────────────────────────────────────────┐ │     saturation/value square, 160px tall
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  │     hue slider
├────────────────────────────────────────────┤
│ ⚠ White text on this color fails contrast  │  7. conditional warning (§5.3)
└────────────────────────────────────────────┘
```

**Palette swatches come before the free picker, always.** That ordering is the whole point of
"palette-aware": the anchored choice is the default path, free picking is the escape hatch. A
user who wants their accent to be the palette's amber should reach it in one tap without ever
seeing a colour wheel.

*Alternative considered:* `Tabs` — "Palette" / "Custom". Rejected: it adds a mode, hides the
escape hatch behind a click, and saves 200px of popover height we can afford.

### 2.3 The swatch groups

**From your base tone** — the eleven steps (05…95) of the *currently selected* neutral ramp,
rendered as one continuous strip with no gaps, dark to light, left to right. Each segment is a
button. Hovering or focusing shows a `Tooltip`: `Neutral 40 · #5e5e5e`.

**From your Home Assistant colors** — the eighteen hues of the *currently selected* extended
palette, as 24px circles, two rows of nine, in the canonical order (red, pink, purple,
deep-purple, indigo, blue, light-blue, cyan, teal, green, light-green, lime, yellow, amber,
orange, deep-orange, brown, blue-grey). Tooltip: `Amber · #ffc107`.

**Both groups MUST re-render when the ramp or palette preset changes**, including while a
popover is open. This is the mechanism that makes the picker palette-aware; it is not decorative.

*Recommended refinement:* the popover should **not** close when the user changes a preset in the
sidebar behind it — that is the one moment where you want to watch the swatches change. Radix
closes on outside interaction by default; exclude the two preset lists:

```tsx
<PopoverContent
  onInteractOutside={(e) => {
    if ((e.target as HTMLElement).closest("[data-preset-list]")) e.preventDefault()
  }}
>
```

If this proves fiddly, letting the popover close is an acceptable fallback — the user reopens it
and sees the new swatches. Do not spend a day on it.

**Recent** — up to eight most-recently-committed values from the free picker or hex field,
newest first, deduplicated, shared across all six popovers, session-only (no persistence in v1).
Hidden entirely when empty — no empty-state row.

**Selected state**: if the current value equals a swatch exactly (case-insensitive hex compare),
that swatch gets a 2px ring plus a check glyph, and `aria-checked="true"`.

### 2.4 Free picking, hex entry, keyboard

**Free picker** — *recommended*: `react-colorful`'s **`<HexColorPicker color={hex} onChange={fn} />`**.
That single component renders *both* the saturation/value square and the hue slider — it is not a
set of primitives you compose, and there is no exported saturation-only or hue-only export. Style
it by overriding the `.react-colorful*` class names (the package ships its own CSS-in-JS); size it
with `.react-colorful { width: 100%; height: 190px }`. Verified details in §6.4.

Keyboard and a11y come from the library: each area is `tabIndex=0`, `role="slider"`, moves in 5%
steps on arrow keys, and carries an `aria-valuetext` (`"Saturation 42%, Brightness 88%"`). **Its
`aria-label` is a hardcoded, non-overridable `"Color"`** — so wrap the picker in a
`<div role="group" aria-label="Pick a custom color">` to give it context. Do not reimplement this
on a canvas.

**Hex field** — an `Input` in the header, `font-mono`.
*Recommended*: a plain shadcn `Input` with our own parsing, **not** react-colorful's
`HexColorInput`. `HexColorInput` exists and accepts 3- or 6-digit hex, but it commits on every
keystroke as soon as the value is valid and has no error state — the opposite of the behaviour
specced below. If an implementer prefers `HexColorInput`, the commit-on-Enter/blur and error-state
rules below are what they lose; raise it rather than silently changing the behaviour.
- Accepts `#abc`, `abc`, `#aabbcc`, `aabbcc`, any case.
- Commits on `Enter` and on blur. Does **not** commit per keystroke (that would fire the engine
  on every character).
- Invalid input: field turns destructive, an inline message reads `Enter a 3 or 6 digit hex color`,
  the committed value is unchanged. `Escape` reverts the field to the committed value.
- Dragging the saturation square updates the field live.

**Reset** — restores this knob's Home Assistant default. Visible only when the value differs from
the default.

**Keyboard and a11y — MUST:**

| | |
|---|---|
| Trigger | `<button>`, `aria-haspopup="dialog"`, `aria-expanded`, accessible name `"Primary color, currently #009ac7"` |
| Open | `Enter` / `Space`. Radix moves focus into the popover; focus lands on the hex `Input`. |
| Close | `Escape` closes and returns focus to the trigger. Click-outside closes and commits. |
| Between groups | `Tab` moves group to group: hex → ramp strip → palette grid → recent → saturation → hue. |
| Within a group | **Roving tabindex.** One swatch per group is in the tab order; `←`/`→` (and `↑`/`↓` in the palette grid) move the roving focus and, per WAI-ARIA radiogroup semantics, select as they move. `Home`/`End` jump to first/last. |
| Group semantics | `role="radiogroup"` with `aria-label` on each group; swatches are `role="radio"`. |
| Swatch names | `aria-label="Neutral 40, #5e5e5e"` — never colour alone. |
| Live region | The header hex value is in an `aria-live="polite"` region so screen readers hear changes made by dragging. Debounce announcements to 300ms. |
| Focus ring | Visible on every swatch, at 2px, offset outward, using the *builder's* focus colour — never a theme colour, which the user could set to something invisible. |
| Contrast | Every swatch carries a 1px inset ring at 12% ink so white/near-white swatches remain visible on a white popover. |

Reduced motion: the popover's open animation respects `prefers-reduced-motion` (shadcn default).

### 2.5 The inline pickers

**Border color** — an 11-segment strip, identical in geometry to the popover's ramp strip, sitting
directly in the sidebar under its label. Semantics: `role="radiogroup"`, arrow-key navigation, one
tab stop. **The stored value is the ramp hex with `1f` alpha appended** (per `template.css`), so
the strip's segments MUST be rendered *at that alpha over the card background*, not at full
opacity — what you see in the strip is what lands on the divider. That makes the strip look like
a very faint gradient; that is correct and it is what the knob does.

**Card background / Primary background** — a four-button row: `Neutral 80`, `Neutral 90`,
`Neutral 95`, `White`. Each button is a swatch above a two-line label. Selected state gets a ring
and a check. Helper text under both: *"Dark mode uses the matching dark shade automatically."*

---

## 3. Knob sidebar IA

### 3.1 Structure

Five groups, **all permanently open**, in one scroll. Group headings are sticky within the
sidebar scroll container (small uppercase, muted, with a `Separator` above).

*Alternative considered:* an `Accordion` with one group open at a time. Rejected — it hides 12
of the 15 knobs behind a click and, worse, makes it impossible to see that changing the base tone
also moved the surfaces. A ~1300px sidebar scroll is fine on a desktop tool.

### 3.2 Groups, order, controls

Labels in `code` are verbatim from `template.css` and MUST be used as-is.

---

**1 · Typography**

| Label | Control | Default |
|---|---|---|
| `Body font family` | Grouped `Select` | Roboto |
| `Headings font family` | Grouped `Select` | Roboto |
| `Longform font family` | Grouped `Select` | System sans |
| `Code font family` | Grouped `Select` | System mono |

Order within the group is **Body, Headings, Longform, Code** — most-used first — which differs
from `template.css`'s declaration order. Labels are unchanged.

All four dropdowns share **one identical list**, grouped with `SelectGroup` + `SelectLabel`
(per the `template.css` NOTE: "show them grouped in the dropdowns"). Every `SelectItem` and
`SelectLabel` MUST sit inside a `SelectGroup` — never directly in `SelectContent` (shadcn
composition rule). Five groups:

- **System** — System sans, System serif, System mono
- **Sans** — Roboto, Inter, Figtree, DM Sans, Nunito Sans, Manrope, Outfit, Rubik
- **Serif** — Source Serif 4, Lora, Merriweather, Bitter
- **Display serif** — Fraunces, Playfair Display
- **Mono** — JetBrains Mono, IBM Plex Mono

**Each `SelectItem` MUST be rendered in its own typeface** at ~15px. That is the entire preview
for this knob and it is worth loading all sixteen webfonts into the builder to get. Load them
from Google Fonts at weights 400/500/700 with `display=swap`, in the builder's own `index.html`.
This is builder-side only and has nothing to do with the exported theme — the export ships its
own `extra_module_url` snippet (§1.4).

Each knob carries one line of helper text, because "longform" means nothing to a HA user:

- Body font family — *Most of the UI: labels, buttons, entity names.*
- Headings font family — *Card and section titles.*
- Longform font family — *Long blocks of text, like a markdown card.*
- Code font family — *Code and YAML, like the template editor.*

---

**2 · Brand & status colors** — six popover pickers (§2.2), in this order:

| Label | Writes | Default |
|---|---|---|
| `Primary color` | `--ha-color-primary-40` | `#009ac7` |
| `Accent color` | `--accent-color` | `#ff9800` |
| `Error color` | `--ha-color-red-50` | `#dc3146` |
| `Warning color` | `--ha-color-orange-70` | `#ff9342` |
| `Success color` | `--ha-color-green-60` | `#00ac49` |
| `Info color` | `--info-color` | `#039be5` |

Group helper text: *"Each of these seeds a full ramp. You pick one shade; the rest are generated."*

---

**3 · Base tone** — the neutral ramp preset picker. `Label: "Base tone"`.

Group helper text: *"Every background, border and text colour comes from this ramp."*

---

**4 · Surfaces** — the three constrained knobs (§2.5), in this order:

| Label | Control |
|---|---|
| `Card background` | 4-swatch row |
| `Primary background` | 4-swatch row |
| `Border color` | 11-segment ramp strip |

---

**5 · Home Assistant colors** — the extended palette preset picker.
`Label: "Home Assistant colors"` (verbatim from `template.css`; see **Open question O-2**).

Group helper text: *"These colour entity icons and badges — a light is amber, a lock is red."*

---

**Ordering rationale.** Fonts first: the fastest visible change, zero risk, and it matches
`template.css`. Brand colours second: the single thing most users came here to change. Then the
neutral system and the surfaces built on it, adjacent so their interaction is visible. The
extended palette last: eighteen values that only affect entity icon colours — the longest tail.

### 3.3 Comparing ~10 ramps and ~8 palettes

A dropdown of names ("Zinc", "Stone", "Mauve") tells the user nothing. Both preset pickers use
the same pattern:

**A vertical list of named colour strips, one row per preset, radio semantics.**

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

The strip is the label. Stacking all ten strips vertically at identical width, aligned on the same
step boundaries, is the comparison — the warm cast of Stone against the blue cast of Slate is
visible at a glance in a way no name and no single swatch can convey. The extended palette picker
is the same component with eighteen segments per row and eight rows.

Implementation: `RadioGroup` / `RadioGroupItem` with the visual indicator suppressed and the strip
rendered as the `Label` content. Selected row: 2px ring in the builder's accent + a filled radio
dot. Full keyboard support comes free from Radix (`↑`/`↓` moves and selects).

**Plus a "Compare all" escape hatch.** A text button under each list opens a `Dialog` at ~1100px
(with a real `DialogTitle` — required, `sr-only` if you do not want it visible)
containing the reference-table view — rows are steps, columns are presets, exactly as in
`.references/colors/*.html`. Clicking a column header selects that preset and closes the dialog.
This costs almost nothing (the data is already there) and serves the user who wants to read
individual hexes rather than eyeball strips.

*Alternative considered:* a `Select` whose items each contain a mini strip. Rejected — you can
only see one at a time when it's closed, and closing the menu is exactly when you want to compare.

*Alternative considered:* showing the strips inside a themed preview surface so they sit on the
user's own background. Rejected — the presets are raw colour data; showing them on the builder's
own neutral surface is the honest comparison.

---

## 4. Preview content audit

The verdict on the artifact was "directionally right, a bit too detailed". Concretely, the detail
is of three kinds, and all three go:

- **Editing controls inside the preview** (`<input type="color">` on swatches, ramp-link
  `<select>`s, "reset" links). **Cut everywhere.** The sidebar is the only control surface.
- **RGB tuples under every swatch.** **Cut everywhere.** The engine omits `rgb-*` companions from
  the YAML where HA auto-derives them from hex (PLAN M1); showing a number nobody copies and
  nothing exports is noise.
- **CSS variable names under every swatch.** **Kept where the variable is the point**
  (surfaces, text), **cut where the label already is the name** (`--neutral-40` under a swatch
  labelled "40"; `--red-color` under a swatch labelled "red").

### 4.1 Surfaces & dividers — **keep, trimmed**

| Artifact | Verdict |
|---|---|
| 4 tiles, 200px, showing the surface colour | **Keep** — tiles at 180px, 2×2 within each panel |
| Label + `--var-name` | **Keep** both. This is the section where the variable name is the payload. |
| `hex · rgb` | **Trim** to hex only |
| Ramp-link `<select>` | **Cut** |
| `reset` link | **Cut** |
| 2px offset outline ring on each tile | **Cut** — decorative; a 1px hairline border in `--divider-color` is enough and is itself a token being previewed |

The four tiles are `--primary-background-color`, `--card-background-color`,
`--secondary-background-color`, `--divider-color`. The divider tile MUST render as a *card with a
hairline rule across it*, not a solid fill — a 12%-alpha value shown as a solid block is
misleading about what the knob does.

### 4.2 Text → **rename "Text & type", keep + one addition**

| Artifact | Verdict |
|---|---|
| 3 × "The quick brown fox" in primary / secondary / disabled | **Keep** |
| `--var-name` | **Keep** |
| `hex · rgb` | **Trim** to hex |
| Ramp-link `<select>`, `reset` | **Cut** |

**Addition — the four fonts have no preview anywhere in the artifact.** That is four of fifteen
knobs with no feedback. Extend this section with a short type specimen inside the same card:

- a heading line in `--ha-font-family-heading`
- a sentence in `--ha-font-family-body`
- a two-line paragraph in `--ha-font-family-longform`
- a single code line in `--ha-font-family-code` (e.g. `sensor.living_room_temperature`)

Each labelled with its role in small muted text. This is the only place the spec *adds* to the
artifact, and it closes a real gap.

### 4.3 Brand & status — **keep, restructured**

| Artifact | Verdict |
|---|---|
| 6 pills: colour circle, label, var name, hex | **Keep the set of six** |
| The colour circle being an `<input type="color">` | **Cut** — this is the artifact's core mistake |
| `reset` link, rgb tuple | **Cut** |

**Restructure**: render each as a **filled chip** — the colour as the background, the label drawn
on it in `--text-primary-color`. The single most important derived value in this whole system is
"is text on the primary colour legible", and rendering it makes the answer visible instead of
reported. Hex sits below the chip in muted mono.

A small warning glyph appears on any chip whose label fails 4.5:1 contrast, with a `Tooltip`
naming the ratio. Non-blocking (§5.3).

*Alternative considered:* keeping the artifact's numeric "vs list row: 3.2" contrast readout.
Rejected — a ratio is a number a HA user has no calibration for; showing them the illegible text
is the same information, understood instantly.

### 4.4 Neutral ramp — **keep the strip, strip the metadata; full width**

| Artifact | Verdict |
|---|---|
| 11 swatches in a row | **Keep** — this is the section, and it now gets the full preview width |
| Step name under each (`05`, `10`, …) | **Keep** |
| `--neutral-05` under each | **Cut** — the step number already *is* the name |
| hex | **Keep** (drops to a tooltip below ~28px/swatch, §1.5) |
| rgb | **Cut** |
| Description mentioning "tune warmth and tint in Tweaks" | **Rewrite** — no such control exists in v1. New copy: *"The backbone of the theme. Every background, border and text colour is a step on this ramp."* |

Renders **once, full width, tagged `Both modes`** (§1.2).

### 4.5 Extended palette → **"Home Assistant colors"; the heaviest cut**

The artifact renders nineteen cards, each with a tint tile containing a colour dot, a label, a var
name, a contrast row, a hex, and (for some) a ramp-link select. That is six pieces of chrome per
colour, 114 in total, for a group of values that mostly tints entity icons.

| Artifact | Verdict |
|---|---|
| Card chrome around every hue | **Cut** |
| Tint tile + inset dot construction | **Cut** — one flat swatch |
| `--{name}-color` under each | **Cut** — the label is the name |
| `vs list row` contrast readout | **Cut** |
| Ramp-link `<select>` for the greys | **Cut** |
| The grey trio (`light-grey`, `grey`, `dark-grey`) | **Cut from this section** — they are neutral ramp aliases and are already visible in §4.4. Leaves exactly 18. |
| hex | **Keep**, muted mono under the name |

Result: a flat grid of **18 named swatches, 6 across, full width**, tagged `Both modes`. Section
description: *"These colour entity icons and badges — a light is amber, a lock is red."*

This is the single biggest reduction in the audit: ~114 elements down to 36.

### 4.6 Applied demo → **"Living room"; keep, promote to first, extend slightly**

The artifact's room card is the best thing in it and needs the least work: five entity tiles, a
brightness slider, a room header with temperature and humidity, already rendered in both modes.
**Keep it essentially as-is.** Rename the section to `Living room` — it is a dashboard, so it
should be labelled like one, not like a design exhibit.

It exercises: card background, primary background, divider, both text colours, primary, and the
border radius. It does **not** exercise error / warning / success / info, or the extended palette.
So M5 adds **one second card** below it, in the same two-panel grid:

- a row of four entity icons in extended-palette colours (amber light, red lock, blue climate,
  green sensor) — proves the palette knob does something visible
- a primary `Button` and a secondary `Button` — proves `--text-primary-color` on `--primary-color`
- one alert strip in each of error, warning, success, info — proves those four knobs
- one entity row in the disabled/unavailable text colour

That is one extra card, not a dashboard. Everything in both cards MUST be built from theme
variables — zero hardcoded colours (M5 acceptance criterion).

### 4.7 Generated values — **cut as a section**

Moved to the export `Sheet` (§1.4). See **Open question O-4**.

### 4.8 Also cut

- The artifact's **light/dark toggle button** in the header — decided against (PLAN §3.4); there is
  no mode state in this app at all.
- The **"Tweaks" panel** concept (warmth/tint/L/C sliders) — presets only in v1 (PLAN §3.6).
- The artifact's **footer paragraph** about methodology.

---

## 5. Empty and edge states

### 5.1 First load

**There is no empty state.** The page loads with the complete Home Assistant default theme —
every knob populated, every preview section rendered, the Export button enabled. A user who
changes nothing and exports gets a valid theme identical to HA's default. (M4 acceptance
criterion: defaults reproduce the current HA default theme exactly.)

The only first-load affordance is one line under the app title:
*"Turn the knobs on the left. Everything updates live, in light and dark at once."*
It is not dismissible and not a modal. **Reset to Home Assistant defaults** is disabled until at
least one knob differs from its default.

### 5.2 No loading state

The engine is synchronous and client-side. There are no spinners, no skeletons, no "generating…".
If a knob change ever takes long enough to need one, that is an engine bug, not a UX problem.
Webfont loading is the one asynchronous thing; `display=swap` handles it and no UI acknowledges it.

### 5.3 Extreme colour choices

The rule: **warn, never block.** It is the user's theme.

| Situation | Behaviour |
|---|---|
| Text on a brand/status colour falls below 4.5:1 | Warning glyph on that chip in the preview (§4.3) **and** a warning row at the bottom of that knob's popover. Both name the problem in plain words: *"White text on this colour is hard to read."* |
| A brand colour is so light or dark that its generated ramp clips at one end | No special UI. The engine clamps; the ramp preview shows the flattening honestly. |
| Secondary text falls below 4.5:1 on the card background in either mode | One warning row under the **Base tone** group: *"Secondary text is low contrast in dark mode with this base tone."* |
| Card background = Primary background (both White, or both Neutral 95) | Allowed. The Surfaces preview shows the two tiles as identical, which is the honest feedback. No warning. |
| Invalid hex typed | §2.4 — field errors, value unchanged. |

Warnings are `Alert variant="default"` with a `TriangleAlert` icon and muted styling — informational,
not destructive. Never a toast; toasts are for things that already happened.

### 5.4 Cross-knob interactions

- **Changing the base tone** re-renders every swatch strip in every open popover, the three
  Surfaces controls, the ramp preview section, and every preview panel. Constrained knobs
  (border, card background, primary background) store a *reference* to a ramp step, so they
  follow the new ramp automatically.
- **Free colours store a literal hex.** If you pick "neutral 40" from a popover strip and then
  change the base tone, that colour does **not** move. It is now an independent value. This is
  predictable but arguably surprising — **Open question O-3**.
- **Changing the extended palette** re-renders the palette swatch group in open popovers and the
  §4.5 section. It does not touch any other knob.
- **Reset to Home Assistant defaults** shows an **`AlertDialog`** — not a `Dialog`; it is a
  destructive confirmation — and clears the Recent list.

---

## 6. Notes to implementers

### 6.1 For M3 — preview pane

1. Build the two-column grid and the sticky column header first; every section drops into it.
   Sections that render once span both columns (`col-span-2`) and carry a `Both modes` `Badge`.
2. **Scoped variables only.** Set the generated CSS custom properties with
   `element.style.setProperty('--x', v)` on the light panel container and the dark panel container.
   **Never on `:root` or `document.documentElement`** — the builder's own shadcn/Tailwind theme
   lives there and must not be touched (analysis §7.7, PLAN §3.4). Two containers, two variable
   sets, one from `engine.derive().light` and one from `.dark`.
3. Preview components style themselves **exclusively** with `var(--ha-*)` / legacy theme vars.
   No Tailwind colour utilities inside a preview panel — `bg-white`, `text-neutral-500`,
   `border-gray-200` are all bugs. Layout utilities (`flex`, `gap-4`, `grid`) are fine.
4. Preview components are **read-only**. No `<input>`, no `<select>`, no click handlers that
   change theme state. The one exception is the mock UI *inside* the applied demo (M5), where a
   toggle or slider may be visually rendered but MUST be inert (`aria-hidden` where appropriate,
   `pointer-events: none`, `tabIndex={-1}`) so it never enters the tab order.
5. Section order is §1.3. Section chrome (label + rule + description) is one shared component.
6. Do not memo-optimise prematurely; the whole preview re-rendering on a knob change is fine at
   this size. If it isn't, memoise at the section boundary.
7. Everything in the preview panels must survive the user setting `--divider-color` to fully
   transparent or `--primary-background-color` to white — panel separation must not depend on a
   theme variable alone. Give each panel a fallback outline in the *builder's* border colour.

### 6.2 For M4 — knob sidebar

1. Fifteen knobs, five groups, §3.2. Labels verbatim from `template.css`.
2. **Zero `<input type="color">`.** Grep for it before opening the PR.
3. Three distinct colour controls, not one: popover picker (×6), inline ramp strip (×1),
   inline 4-swatch row (×2). §2.1.
4. The popover's swatch groups read from the *current* ramp and palette preset in the store — they
   are derived state, not props frozen at mount. Verify by opening a popover, changing the base
   tone in the sidebar behind it, and watching the strip change.
5. Hex commits on Enter/blur, not per keystroke (§2.4).
6. The border colour value is `${rampHex}1f` — and its strip renders at that alpha (§2.5).
7. Font `SelectItem`s render in their own typeface; load all sixteen webfonts in the builder's
   `index.html` (§3.2).
8. Roving tabindex on every swatch group. This is the only non-trivial a11y work in M4 and it is
   an acceptance criterion. Radix's `RadioGroup` gives it for free — prefer it over hand-rolling.
9. Knob changes should feel instant. Debounce only the saturation-square drag (to ~16ms /
   `requestAnimationFrame`); everything else is discrete.

### 6.3 shadcn components expected

Already in the repo: `button`, `card`.

To add (all confirmed present in the shadcn registry on 2026-08-09 — §6.4):

| Component | Used for |
|---|---|
| `popover` | Colour picker (§2.2) |
| `input` | Hex field, theme name |
| `label` | Every knob |
| `field` | *Recommended* wrapper for a knob row — `FieldLabel` / `FieldDescription` (the helper text) / `FieldError`. Saves hand-rolling the label + help + error stack fifteen times. Pulls in `label` and `separator`. |
| `select` | Font dropdowns (`SelectGroup` + `SelectLabel` required) |
| `radio-group` | Ramp picker, palette picker, all swatch groups (`RadioGroup` + `RadioGroupItem`) |
| `dialog` | "Compare all" tables — needs a `DialogTitle` |
| `alert-dialog` | Reset confirmation (destructive → `AlertDialog`, not `Dialog`) |
| `sheet` | Export panel; sidebar below 1024px — needs a `SheetTitle` |
| `tabs` | Export sheet (`TabsTrigger` inside `TabsList`) |
| `tooltip` | Swatch hex on hover/focus |
| `separator` | Sidebar group dividers (never a raw `<hr>` or bordered `<div>`) |
| `scroll-area` | Sidebar, YAML block |
| `alert` | Contrast warnings, install instructions (`AlertTitle` + `AlertDescription`) |
| `badge` | `Light` / `Dark` / `Both modes` tags (never a hand-styled `<span>`) |
| `sonner` | "Copied to clipboard" |

**`sonner` gotcha:** the registry's `ui/sonner.tsx` declares a `next-themes` dependency and calls
`useTheme()` from it. This is a Vite app, not Next. Delete the `next-themes` import and hardcode
`theme="light"` (or read the builder's own theme) rather than installing `next-themes`.

Third-party: **`react-colorful`** (PLAN §3.7). No other UI dependency.

Icons: `lucide-react`, already installed. Verified export names in the installed version —
`CheckIcon`, `TriangleAlertIcon`, `CopyIcon`, `DownloadIcon`, `RotateCcwIcon`, `ChevronDownIcon`.
(`AlertTriangle` is the old name and still resolves, but prefer `TriangleAlertIcon`.) Icons inside
a `Button` take `data-icon="inline-start"` / `"inline-end"` and **no sizing classes** — the
component sizes them.

**Do not use:** the shadcn `sidebar` block (§1.1); `command` / `combobox` for the font pickers
(nineteen items in five groups do not need search); `native-select` (we need per-item typefaces,
which a native `<option>` cannot render reliably across browsers).

*Latitude:* `toggle-group` would also work for the 4-swatch background rows and `item` for the
preset rows. I am recommending `radio-group` for both because one pattern covers every swatch group
in the app, but an implementer who finds `toggle-group` cleaner for the 4-option case should say so
rather than mixing both silently.

### 6.4 Versions verified

Checked against the npm registry and the upstream sources on **2026-08-09**. Re-verify before
building if significant time has passed — do not take these on trust from this document alone.

| Thing | Verified |
|---|---|
| `react-colorful` | **5.8.0**, published 2026-07-13. Peer deps `react >=16.8.0` — React 19 is fine. Exports whole pickers only (`HexColorPicker`, `HexColorInput`, `RgbColorPicker`, …); **no** saturation/hue sub-exports. Arrow keys move in 5% steps; interactive areas are `tabIndex=0` `role="slider"` with `aria-valuetext`; `aria-label` is hardcoded `"Color"`. `validHex` accepts 3- and 6-digit. |
| `radix-ui` (unified) | **1.6.7**, already a dependency. Peers include `^19.0` — fine. |
| `lucide-react` | **1.31.0**, already a dependency. Both `TriangleAlert` and `TriangleAlertIcon` are exported; same dual naming for the rest. |
| `sonner` | **2.0.8**. |
| shadcn registry | All fifteen components listed in §6.3 present in the current registry index. `Field` exposes `Field`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldGroup`, `FieldLabel`, `FieldLegend`, `FieldSeparator`, `FieldSet`, `FieldTitle`. `RadioGroup` exposes `RadioGroup`, `RadioGroupItem`. |

`ui.shadcn.com`, `unpkg.com` and `cdn.jsdelivr.net` are blocked by this environment's egress
policy. The npm registry and `raw.githubusercontent.com` are reachable, and there is a local
shadcn skill at `.claude/skills/shadcn/` with the composition, icon and styling rules — use those.

---

## 7. Open questions for the owner

| # | Question | My recommendation |
|---|---|---|
| **O-1** | Should the three constrained knobs (border, card background, primary background) use the same popover as the other six, for uniformity — or inline swatch rows as specced? | **Inline.** Four options do not need a popover, and the inline form makes the constraint visible. |
| **O-2** | `template.css` labels the extended palette knob **"Home Assistant colors"**. Inside a Home Assistant theme builder that reads as "the colours" rather than "the eighteen named entity colours". Keep verbatim, or relabel (e.g. **"Entity colors"** / **"Named colors"**)? | I kept it verbatim as instructed, but I think it will confuse people. **"Entity colors"** is my suggestion. |
| **O-3** | When a user picks a colour *from* the ramp/palette strip and then changes the preset, should that colour follow the preset or stay put? Spec says stay put (stores a literal hex). | **Stay put** — predictable, and "my primary went green because I changed the base tone" is worse than "my primary didn't move". But a reasonable person could want the opposite. |
| **O-4** | I cut the always-visible "Generated values" YAML section in favour of an export sheet. Do you want the live YAML back as a permanent panel? | **No** — one home for export. If you want the trust signal, a small "12 variables changed" counter on the Export button is cheaper. |
| **O-5** | Applied demo promoted to the **first** preview section, above the token sections. Agree? | **Yes** — it is the answer to the question the user actually has. |
| **O-6** | Font shortlist sign-off (PLAN §3, already ✅ 2026-08-09): 8 sans / 4 serif / 2 display serif / 2 mono / 3 system = 19 items in one grouped list, shared by all four font knobs. Confirm 19 items in a single dropdown is acceptable (it is ~500px tall, scrolled). | **Yes**, with items rendered in their own typeface. If it feels long, the display serifs are the first to go. |
| **O-7** | Recent colours are session-only (lost on reload). Persist to `localStorage`? | **No** in v1 — PLAN §3.9 puts shareable/persisted config in M7 backlog; adding one localStorage key here invites the rest. |

---

## 8. Summary of changes vs. the artifact

| | Artifact | This spec |
|---|---|---|
| Control surface | Sidebar **and** in-preview editing | Sidebar only |
| Colour input | `<input type="color">` under an opacity-0 overlay | Custom popover, palette-first |
| Light/dark | A toggle button | Two permanent columns |
| Section count | 7 | 6 (5 token + 1 demo) |
| Applied demo position | 6th | 1st |
| Per-swatch metadata | label + var + hex + rgb + select + reset | label + hex (+ var where it matters) |
| Extended palette | 19 cards, ~114 elements | 18 flat swatches, 36 elements |
| Export | Section at the bottom | Sheet from the app bar |
| Font preview | None | Type specimen in "Text & type" + fonts rendered in the dropdown |
| Ramp/palette choice | A `<select>` of names | Ten/eight stacked strips + a compare-all table |
