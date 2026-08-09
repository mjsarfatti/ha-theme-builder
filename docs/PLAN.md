# HA Theme Builder — Product Plan

> Status: **proposal for review (rev 2)** · Author: Claude (PM) · Last updated: 2026-08-09

## 1. Product brief

**What:** A self-contained, static web app where a Home Assistant user turns a small
number of "knobs" (fonts, a handful of seed colors, ramp presets) and instantly sees a
live preview of design tokens and realistic HA cards — then copies or downloads a
ready-to-paste YAML theme.

**Why:** HA theming is powerful but hostile: hundreds of undocumented variables, a
four-tier token cascade, derivation rules you have to know by heart (rgb companions,
`text-primary-color` contrast, dark-mode `modes:` blocks). Nobody has shipped a builder
that works at the *token* level (the new `--ha-color-*` ramps) rather than pasting hex
codes into legacy vars.

**For whom:** HA users who want a coherent custom theme without reading frontend source.

**Success looks like:** paste the generated YAML into `configuration.yaml`, reload, and
the HA UI looks exactly like the preview did — light *and* dark mode.

## 2. What we already have (reference inventory)

| Reference | Role — treat as |
|---|---|
| `.references/ha_theme_analysis.md` | **Authoritative spec** of the HA theme system: variable taxonomy, cascade, YAML→CSS pipeline, derivation math (Lab brighten/darken, WCAG contrast), gotchas. §7 is a first-pass generator architecture. |
| `.references/template.css` | **The knob spec.** Every var annotated `KNOB` (user-facing control, with label) or `DERIVED` (computed). The inline NOTEs are product requirements. |
| `.references/colors/ha-color-palettes.html` | **The extended-palette presets, v1-final:** Home Assistant (current), Tailwind v3, Tailwind v4, Bulma, Material Accent, Ant Design, Chakra UI, Rounded Theme. |
| `.references/colors/black-white-ramps.html` | **The neutral-ramp presets, v1-final:** Home Assistant (current), Gray, Slate, Zinc, Stone, Mauve, Olive, Mist, Taupe (Tailwind-derived), Rounded Theme. |
| `.references/claude-design/` | **The preview-pane blueprint.** Its mock sections — Surfaces & dividers, Text, Brand & status, Neutral ramp, Extended palette, Applied demo, Generated values — are the v1 preview structure, with light and dark rendered side by side. |

## 3. Product decisions

Decided with the user (✅) or proposed by PM (→ flag disagreement on the PR).

1. ✅ **Stack:** Vite + React + TypeScript + shadcn/ui (vite template), Tailwind,
   **pnpm**. 100% client-side, no backend. Deploy to **GitHub Pages** via Actions.
2. → **The theme engine is the product.** A pure, UI-free TypeScript module
   (`src/engine/`): `seeds → ramps → derived tokens → YAML`. Fully unit-tested,
   including snapshot tests of YAML output. The UI is a thin shell over it. This is
   the one part where correctness beats speed.
3. → **Color math in OKLCH** for ramp *generation* (perceptually uniform — the
   05..95 ramps around each seed color), while reproducing HA's own Lab-based
   derivations where the analysis doc says HA computes them (`dark-primary-color`,
   contrast checks) so output matches HA behavior.
4. ✅ **Preview = the Claude design artifact's mock sections**, rebuilt as React
   components styled *exclusively* with `--ha-*`/legacy theme vars, rendered inside
   scoped containers where the generated variables are set (never on `:root` — the
   builder's own shadcn styling must not leak in, per analysis §7.7). **Light and
   dark mode are shown at the same time, side by side** — no mode toggle.
5. → **Both modes generated from day one.** The engine always produces a light +
   dark pair (`modes:` block); the side-by-side preview makes this visible
   constantly. Retrofitting dark into the derivation chain later would mean
   reworking every formula.
6. ✅ **Presets only, no custom options, in v1.** Neutral ramp and extended palette
   are chosen from the presets in `.references/colors/` — exactly those, nothing
   else. No custom warmth/tint sliders, no custom OKLCH L/C, no from-scratch
   palettes (Hearth was a typo; Pastel is deferred). Custom options go to the
   backlog (M7).
7. ✅ **Color picking UX (for primary, accent, error, warning, success, info,
   border, backgrounds):**
   - **Never the browser-native color input.** A custom picker component
     (e.g. a popover with an `react-colorful`-style area/hue picker + hex field).
   - **Palette-aware:** the picker must also offer the swatches from the currently
     selected neutral ramp and extended palette, one tap away, so users can anchor
     seed colors to their chosen system. Exact interaction is a deliverable of the
     UX milestone (M2).
8. → **Knob set v1 = exactly the `KNOB` annotations in `template.css`**, minus the
   custom preset options per decision 6. That's: 4 font families, primary, accent,
   error, warning, success, info, neutral-ramp preset, extended-palette preset,
   border color, card background, primary background.
9. → **Out of scope for v1:** theme import, per-card themes, energy color knobs
   (keep HA defaults, per template.css note), state-color editing, custom
   ramp/palette options, shareable URLs (M7 backlog).

### Font shortlist (✅ approved 2026-08-09)

Per template.css: 8 sans, 4 serif, 2 display serif, 2 mono from Google Fonts, plus
a system option for sans, serif, and mono.

- **Sans (8):** Roboto *(HA default)*, Inter, Figtree, DM Sans, Nunito Sans,
  Manrope, Outfit, Rubik
- **Serif (4):** Source Serif 4, Lora, Merriweather, Bitter
- **Display serif (2):** Fraunces, Playfair Display
- **Mono (2):** JetBrains Mono, IBM Plex Mono
- **System:** system sans (`system-ui` stack), system serif, system mono

✅ **Font loading (decided):** HA only ships Roboto — a YAML theme can set
`--ha-font-family-*` but cannot load a web font. The export step (M6) therefore
ships a font-loading snippet (`extra_module_url`) + instructions alongside the
YAML whenever a non-system, non-Roboto font is selected.

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
dark preview containers, (b) engine.yaml() → export panel`. One direction, no
feedback loops.

## 5. Milestones

One milestone = one work package for a coder/design agent: own branch, own PR,
reviewed against acceptance criteria before dependent work starts.

### M0 — Scaffold *(small)*
Vite + shadcn app boots with **pnpm**; lint/typecheck/test/build in CI; auto-deploy
to GitHub Pages.
- ✅ `pnpm dev/build/test/lint` all green in CI; live URL serves the default app.

### M1 — Theme engine *(the critical one; parallel with M2)*
`engine/` complete per §4, driven by `template.css` + analysis doc §§4–7.
- ✅ Every `DERIVED` var in `template.css` computed from its documented source.
- ✅ Ramp generator: knob shade preserved verbatim at its slot (e.g. primary-40),
  other shades generated around it.
- ✅ Neutral + extended-palette preset data extracted 1:1 from `.references/colors/`.
- ✅ YAML output: hex values quoted, rgb companions omitted where HA auto-derives
  them (hex inputs), `modes: {light, dark}` structure, valid per analysis §5.
- ✅ Unit tests for color math; snapshot test of full YAML for a fixture config.

### M2 — UX spec *(new; parallel with M1; gates all UI milestones)*
Mostly UX, some UI. Deliverables, reviewed by the user before M3/M4 start:
- **Layout spec:** knob sidebar + preview pane arrangement; how the side-by-side
  light/dark presentation works per section (split columns? paired panels?);
  responsive behavior; where export lives.
- **Interaction spec for the color picker** (decision 7): popover anatomy, hex
  entry, palette/ramp swatch tab, recently-used, keyboard behavior.
- **Knob sidebar IA:** grouping, ordering, and labels (from template.css), preset
  picker presentation (how a user compares 9 neutral ramps meaningfully).
- **Preview content audit:** which parts of each artifact section to keep, trim,
  or simplify ("directionally right, too detailed" — decide what stays).
- **Font shortlist sign-off** (§3 draft) + validation of the font-loading risk.
- Format: low-fi clickable HTML wireframe + a short written spec — cheap to
  produce, cheap to throw away. No production code.
- ✅ User has signed off on the spec; M3/M4 briefs reference it.

### M3 — Preview pane: token sections *(after M1 + M2)*
Surfaces & dividers, Text, Brand & status, Neutral ramp, Extended palette —
light and dark side by side, driven by live engine output.
- ✅ Changing any knob visibly updates both modes of every section, no reload.
- ✅ Matches the M2 spec.

### M4 — Knob sidebar *(after M1 + M2; parallel with M3)*
All v1 knobs as shadcn controls per the M2 spec, including the custom color picker
with palette swatches.
- ✅ Every `KNOB` in `template.css` has its control and label; no native color inputs.
- ✅ Defaults reproduce the current HA default theme exactly.

### M5 — Preview pane: Applied demo
The artifact's "Applied demo" mock HA card section (and any additional mock HA
elements the M2 spec calls for), light + dark side by side.
- ✅ Components use only theme variables — audit: zero hardcoded colors.
- ✅ Recognizably "Home Assistant" at a glance in both modes.

### M6 — Export & polish
"Generated values" section: YAML panel with copy button, download `themes.yaml`,
theme-name field, install instructions **including the font-loading snippet**
(§3 risk). Responsive pass, a11y pass on controls.
- ✅ Generated YAML pasted into a real HA instance renders as previewed (manual
  verification by the user — the ultimate acceptance test).

### M7 — Backlog (post-v1)
Custom neutral ramp (warmth/tint) · custom extended palette (OKLCH L/C) · new
designed palettes (e.g. Pastel) · shareable config URLs · starter presets · theme
import · state/energy color groups.

**Sequencing:** M0 → (M1 ∥ M2) → (M3 ∥ M4) → M5 → M6. Engine API frozen at end of
M1; UX spec frozen at end of M2; changes after that require a PM decision.

## 6. Ways of working

- **This session is the PM.** Plans, specs work packages, reviews PRs, does not code.
- **One milestone = one agent = one branch** (`feat/m1-engine`, …) **= one PR** into
  `main`. The work-package brief includes: goal, pointers into the references and
  the M2 spec, acceptance criteria (above), and definition of done.
- **Definition of done:** CI green (lint, typecheck, tests, build, all via pnpm) ·
  acceptance criteria demonstrably met (screenshots in the PR for UI work) · no
  scope creep beyond the brief.
- **Review gate:** PM reviews each PR against acceptance criteria + a code-review
  pass; user has final say on M2 (spec sign-off) and anything visual (M3–M6).

## 7. Decision log

Resolved with the user (2026-08-09): GitHub Pages ✅ · pnpm ✅ · preview = artifact
mock sections with simultaneous light/dark ✅ · presets only, from
`.references/colors/`, no custom options in v1 ✅ · Hearth/Pastel dropped ✅ · no
native color pickers, palette-aware picker required ✅ · font shortlist approved ✅ ·
export ships `extra_module_url` font-loading instructions ✅.

No open questions. Next decision points arrive with the M2 UX spec review.
