# HA Theme Builder — Product Plan

> Author: Claude (PM) · Last updated: 2026-10-19

## 1. Product brief

**What:** A self-contained, static web app. A Home Assistant user turns a small number
of "knobs" (fonts, a few seed colors, ramp presets). The app shows a live preview of
design tokens and realistic HA cards. The user then copies or downloads a ready-to-paste
YAML theme.

**Why:** HA theming is powerful but difficult. It has hundreds of undocumented
variables, a four-tier token cascade, and derivation rules that the user must learn
(rgb companions, `text-primary-color` contrast, dark-mode `modes:` blocks). No builder
works at the *token* level (the `--ha-color-*` ramps). Existing tools paste hex codes
into legacy variables.

**For whom:** HA users who want a coherent custom theme without reading frontend source.

**Success:** The user pastes the generated YAML into `configuration.yaml` and reloads.
The HA UI then looks exactly like the preview, in light *and* dark mode.

## 2. Reference inventory

| Reference | Role |
|---|---|
| `.references/ha_theme_analysis.md` | **The working description** of the HA theme system: variable taxonomy, cascade, YAML→CSS pipeline, derivation math (Lab brighten/darken, WCAG contrast), and gotchas. §7 is a first-pass generator architecture. It is correct for most tasks. HA's own source is the final authority when the two conflict. |
| `.references/template.css` | **The knob spec.** Every variable has the annotation `KNOB` (user-facing control, with label) or `DERIVED` (computed). The inline NOTEs are product requirements. |
| `.references/colors/ha-color-palettes.html` | **The extended-palette presets, v1-final:** Home Assistant (current), Tailwind v3, Tailwind v4, Bulma, Material Accent, Ant Design, Chakra UI, Rounded Theme. |
| `.references/colors/black-white-ramps.html` | **The neutral-ramp presets, v1-final:** Home Assistant (current), Gray, Slate, Zinc, Stone, Mauve, Olive, Mist, Taupe (Tailwind-derived), Rounded Theme. |
| `.references/claude-design/` | **The preview-pane blueprint.** Its mock sections are the v1 preview structure, with light and dark rendered side by side. The sections are: Surfaces & dividers, Text, Brand & status, Neutral ramp, Extended palette, Applied demo, and Generated values. |

## 3. Product decisions

✅ = decided with the user. → = decided by the PM. Disagreement with a PM decision goes
on the PR.

1. ✅ **Stack:** Vite + React + TypeScript + shadcn/ui (vite template), Tailwind,
   **pnpm**. The app runs 100% on the client and has no backend. It deploys to
   **GitHub Pages** through Actions.
2. → **The theme engine is the product.** The engine is a pure, UI-free TypeScript
   module (`src/engine/`) with the flow `seeds → ramps → derived tokens → YAML`. Unit
   tests cover it fully, including snapshot tests of the YAML output. The UI is a thin
   shell over the engine. For the engine, correctness has priority over speed.
3. → **Color math in OKLCH** for ramp *generation*. OKLCH is perceptually uniform,
   which suits the 05..95 ramps around each seed color. Where the analysis doc says HA
   computes a value in Lab (`dark-primary-color`, contrast checks), the engine
   reproduces that math, so the output matches HA behavior.
4. ✅ **Preview = the mock sections of the Claude design artifact.** The mock sections
   are React components. They use `--ha-*` and legacy theme variables exclusively.
   The generated variables go on scoped containers, never on `:root`, so the builder's
   own shadcn styling cannot leak into the preview (analysis §7.7). **The preview shows
   light and dark mode at the same time, side by side.** The preview has no mode
   toggle.
5. → **Both modes are generated from the first version.** The engine always produces a
   light and dark pair (`modes:` block). The side-by-side preview shows both modes at
   all times. A later addition of dark mode to the derivation chain would require
   rework of every formula.
6. ✅ **Presets only in v1.** The user chooses the neutral ramp and the extended
   palette from the presets in `.references/colors/`, exactly those presets. The
   custom controls (warmth and tint sliders, OKLCH L and C, from-scratch palettes)
   are in the backlog (M7).
7. ✅ **Color picking UX (for primary, accent, error, warning, success, info, border,
   backgrounds):**
   - **Never the browser-native color input.** The picker is a custom component. For
     example: a popover with a `react-colorful`-style area and hue picker, plus a hex
     field.
   - **Palette-aware:** The picker also offers the swatches from the selected neutral
     ramp and extended palette, one tap away. The user can anchor seed colors to the
     chosen system. The UX milestone (M2) delivers the exact interaction.
8. → **The v1 knob set is the `KNOB` annotations in `template.css`**, without the
   custom preset options of decision 6. The set is: 4 font families, primary, accent,
   error, warning, success, info, neutral-ramp preset, extended-palette preset, border
   color, card background, and primary background.
9. ✅ **The starting point is "Home Assistant Refined"** (decided 2026-08-11).
   `template.css` is a *redesign* of stock HA. 40 variables per mode differ from what
   HA ships, because the redesign places a few values on the ramps:
   - `neutral-95` for the page background, where stock HA uses `#fafafa`, a value that
     is on no ramp
   - primary-30, primary-20 and primary-50 for the legacy Material blues
   - `--ha-color-neutral-05` as the shadow base, where stock HA uses black

   The product models **only** the refined theme. It is the load state, and every
   knob moves away from it.
10. → **Out of scope for v1:**
    - Theme import
    - Per-card themes
    - Energy color knobs (the HA defaults stay, per the `template.css` note)
    - State-color editing
    - Custom ramp and palette options
    - Shareable URLs (M7 backlog)

### Font shortlist (✅ approved 2026-08-09)

`template.css` defines the list: 8 sans, 4 serif, 2 display serif, and 2 mono from
Google Fonts, plus a system option for sans, serif, and mono.

- **Sans (8):** Roboto *(HA default)*, Inter, Figtree, DM Sans, Nunito Sans,
  Manrope, Outfit, Rubik
- **Serif (4):** Source Serif 4, Lora, Merriweather, Bitter
- **Display serif (2):** Fraunces, Playfair Display
- **Mono (2):** JetBrains Mono, IBM Plex Mono
- **System:** system sans (`system-ui` stack), system serif, system mono

✅ **Font loading (decided):** HA ships only Roboto. A YAML theme can set
`--ha-font-family-*` but cannot load a web font. When the user selects a font that is
neither a system font nor Roboto, the export step (M6) adds a font-loading snippet
(`extra_module_url`) and instructions to the YAML.

## 4. Architecture

```
src/
  engine/              ← pure TS, zero React imports
    ramps.ts           ← seed color → 05..95 ramp (OKLCH)
    derive.ts          ← seeds → full variable map (light + dark), HA Lab math
    yaml.ts            ← variable map → YAML string (quoted hex, modes block)
    presets/           ← data: font list, neutral ramps, extended palettes
                          (extracted from .references/colors/)
  state/               ← single theme-config store (URL-serializable shape)
  components/
    knobs/             ← sidebar controls (shadcn) incl. the custom color picker
    preview/           ← the artifact's sections, each rendered light + dark:
      SurfacesDividers / Text / BrandStatus / NeutralRamp / ExtendedPalette /
      AppliedDemo (mock HA card) / GeneratedValues (YAML)
  App.tsx              ← sidebar + preview layout, export bar
```

Data flow: `knobs → store → engine.derive() → (a) CSS vars set on the light and
dark preview containers, (b) engine.yaml() → export panel`. The flow has one
direction and contains no feedback loops.

## 5. Milestones

One milestone is one work package for a coder or design agent. Each work package has
its own branch and its own PR. The PM reviews the PR against the acceptance criteria
before dependent work starts.

### M0 — Scaffold *(small)*
The Vite and shadcn app boots with **pnpm**. CI runs lint, typecheck, test and
build. The app deploys to GitHub Pages automatically.
- ✅ `pnpm dev/build/test/lint` all pass in CI. The live URL serves the default app.

### M1 — Theme engine *(the critical one, parallel with M2)*
`engine/` is complete per §4. `template.css` and analysis doc §§4–7 drive it.
- ✅ The engine computes every `DERIVED` var in `template.css` from its documented
  source.
- ✅ Ramp generator: the knob shade stays verbatim at its slot (for example,
  primary-40). The generator builds the other shades around it.
- ✅ The engine extracts the neutral and extended-palette preset data 1:1 from
  `.references/colors/`.
- ✅ YAML output: hex values are quoted, rgb companions are omitted where HA derives
  them automatically (hex inputs), the structure is `modes: {light, dark}`, and the
  output is valid per analysis §5.
- ✅ Unit tests cover the color math. A snapshot test covers the full YAML of a
  fixture config.

### M2 — UX spec *(parallel with M1, gates all UI milestones)*
M2 is mostly UX and some UI. The user reviews the deliverables before M3 and M4
start:
- **Layout spec:** the arrangement of the knob sidebar and the preview pane. It
  defines how the side-by-side light and dark presentation works per section (split
  columns or paired panels), the responsive behavior, and where export lives.
- **Interaction spec for the color picker** (decision 7): popover anatomy, hex
  entry, palette/ramp swatch tab, recently-used colors, keyboard behavior.
- **Knob sidebar IA:** grouping, ordering, and labels (from template.css), and the
  presentation of the preset picker (how a user compares 9 neutral ramps
  meaningfully).
- **Preview content audit:** which parts of each artifact section stay, which parts
  are trimmed, and which parts are simplified. The review of the artifact found it
  "directionally right, too detailed".
- **Font shortlist sign-off** (§3 shortlist) and validation of the font-loading risk.
- Format: a low-fidelity clickable HTML wireframe and a short written spec. No
  production code.
- ✅ The user approved the spec. The M3 and M4 briefs reference it.

### M3 — Preview pane: token sections *(after M1 + M2)*
Sections: Surfaces & dividers, Text, Brand & status, Neutral ramp, and Extended
palette. Light and dark mode show side by side, and live engine output drives both.
- ✅ A change to any knob updates both modes of every section without a reload.
- ✅ The result matches the M2 spec.

### M4 — Knob sidebar *(after M1 + M2, parallel with M3)*
All v1 knobs are shadcn controls per the M2 spec. The sidebar includes the custom
color picker with palette swatches.
- ✅ Every `KNOB` in `template.css` has its control and label. The sidebar contains
  no native color inputs.
- ✅ Knobs start at `DEFAULT_CONFIG`, and the preview shows exactly that:
  Home Assistant Refined (§3 decision 9). Every control's readout is true on load.

### M4b — PR preview deploys *(after the M3 and M4 PRs merge)*
Every pull request gets a live preview on GitHub Pages. The user opens it on a phone
and reviews the PR without a local build.
- Each PR deploys to its own subpath, for example `/ha-theme-builder/pr-<number>/`.
  The `main` deploy stays at the root. A PR deploy does not overwrite it.
- The workflow posts the preview link as a PR comment and updates the comment on
  each push.
- The workflow removes the preview when the PR closes or merges.
- A fork PR gets no preview, because the workflow has no write access for it.
- Each preview builds with the matching Vite `base` path.
- ✅ A new draft PR shows a working preview link within the CI run time. The
  preview matches the `pnpm build` output of that PR.

### M5 — Preview pane: Applied demo
The artifact's "Applied demo" mock HA card section, and any additional mock HA
elements that the M2 spec specifies. Light and dark mode show side by side.
- ✅ Components use only theme variables. Audit result: zero hardcoded colors.
- ✅ The result looks like Home Assistant at a glance in both modes.

### M6 — Export & polish
The "Generated values" section is a YAML panel with a copy button, a download of
`themes.yaml`, a theme-name field, and install instructions **including the
font-loading snippet** (§3, font loading). M6 also includes a responsive pass and an
a11y pass on controls.
- ✅ The generated YAML renders as previewed when the user pastes it into a real HA
  instance (manual verification by the user, the final acceptance test).

### M7 — Backlog (post-v1)
- Custom neutral ramp (warmth and tint)
- Custom extended palette (OKLCH L and C)
- New designed palettes, for example Pastel
- Shareable config URLs
- Starter presets
- Theme import
- State and energy color groups
- **A "Home Assistant (stock)" starter preset.** This preset is the place for the
  40 values from §3 decision 9 that are on no ramp.

**Sequencing:** M0 → (M1 ∥ M2) → (M3 ∥ M4) → M4b → M5 → M6. The engine API freezes at
the end of M1. The UX spec freezes at the end of M2. A change to either one
requires a PM decision.

## 6. Ways of working

- **This session is the PM.** The PM plans, writes specs for work packages, and
  reviews PRs. The PM does not code.
- **One milestone = one agent = one branch** (`feat/m1-engine`, …) **= one PR** into
  `main`. The work-package brief includes: the goal, pointers into the references and
  the M2 spec, the acceptance criteria (above), and the definition of done.
- **Definition of done:**
  - CI passes (lint, typecheck, tests, build, all through pnpm).
  - The acceptance criteria are demonstrably met (screenshots in the PR for UI work).
  - The work stays inside the scope of the brief.
- **Review gate:** The PM reviews each PR against the acceptance criteria and does a
  code-review pass. The user has the final say on M2 (spec approval) and on anything
  visual (M3–M6).

## 7. Decision log

Decided with the user on 2026-08-09:

- GitHub Pages ✅
- pnpm ✅
- Preview = the artifact mock sections, with light and dark at the same time ✅
- Presets only, from `.references/colors/`. Custom options are not part of v1 ✅
- The picker is palette-aware, and the app uses no native color pickers ✅
- Font shortlist approved ✅
- Export ships `extra_module_url` font-loading instructions ✅

Decided with the user on 2026-08-11:

- One starting theme, **Home Assistant Refined** = `template.css` ✅
- The product does not model stock HA. A starter preset for stock HA is in the M7
  backlog ✅ (§3 decision 9)
