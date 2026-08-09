# HA Theme Builder — Product Plan

> Status: **proposal for review** · Author: Claude (PM) · Last updated: 2026-08-09

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
| `.references/template.css` | **The knob spec.** Every var annotated `KNOB` (user-facing control, with label) or `DERIVED` (computed). The inline NOTEs are product requirements (font list composition, neutral presets, extended-palette presets, background choices). |
| `.references/colors/*.html` | Candidate **neutral ramps** (black/white) and **extended palette systems** (MUI, Tailwind, etc.) the user picks from. Source data for presets. |
| `.references/claude-design/` | **Layout inspiration** for the preview pane (token swatches, ramps, applied card demo). Directionally right, intentionally more detailed than we'll ship in v1. |

## 3. Product decisions (proposed defaults)

These are my recommendations. Each is cheap to change now and expensive later —
flag disagreement on the PR.

1. **Stack:** Vite + React + TypeScript + shadcn/ui (vite template), Tailwind. 100%
   client-side, no backend. Deploy to GitHub Pages via Actions.
2. **The theme engine is the product.** A pure, UI-free TypeScript module
   (`src/engine/`): `seeds → ramps → derived tokens → YAML`. Fully unit-tested,
   including snapshot tests of YAML output. The UI is a thin shell over it. This is
   the one part where correctness beats speed.
3. **Color math in OKLCH** for ramp *generation* (perceptually uniform, modern,
   easy warmth/tint controls for the custom neutral ramp), while reproducing HA's
   own Lab-based derivations where the analysis doc says HA computes them
   (`dark-primary-color`, contrast checks) so output matches HA behavior.
4. **Preview = hand-built mock HA components**, not embedded HA frontend code.
   Plain React components styled *exclusively* with `--ha-*`/legacy vars, rendered
   inside a scoped container where the generated variables are set (never on
   `:root` — the builder's own shadcn styling must not leak in, per analysis §7.7).
   Fidelity is "instantly recognizable as HA", not pixel-perfect.
5. **Both modes from day one.** The engine always produces a light + dark pair
   (`modes:` block); the preview has a light/dark toggle. Retrofitting dark mode
   into the derivation chain later would mean reworking every formula.
6. **Knob set v1 = exactly the `KNOB` annotations in `template.css`.** No additions
   until v1 ships. That's: 4 font families, primary, accent, error, warning,
   success, info, neutral-ramp preset (+ custom warmth/tint), extended-palette
   preset (+ custom OKLCH L/C), border color, card background, primary background.
7. **Out of scope for v1:** theme import/reverse-engineering, per-card themes,
   energy color knobs (keep HA defaults, per template.css note), state-color
   editing, shareable URLs (stretch goal, see M6).

## 4. Architecture

```
src/
  engine/              ← pure TS, zero React imports
    ramps.ts           ← seed color → 05..95 ramp (OKLCH)
    neutrals.ts        ← neutral presets + custom warmth/tint
    palette.ts         ← extended palette presets + custom L/C
    derive.ts          ← seeds → full variable map (light + dark), HA Lab math
    yaml.ts            ← variable map → YAML string (quoted hex, modes block)
    presets/           ← data: font list, ramp/palette preset values
  state/               ← single theme-config store (URL-serializable shape)
  components/
    knobs/             ← sidebar controls (shadcn)
    preview/
      tokens/          ← ramp strips, font specimens, semantic token grid
      ha/              ← mock HA components: card, sidebar, header, entity rows,
                         buttons, inputs, badges — styled only with theme vars
  App.tsx              ← sidebar + preview layout, mode toggle, export bar
```

Data flow: `knobs → store → engine.derive() → (a) CSS vars set on preview
container, (b) engine.yaml() → export panel`. One direction, no feedback loops.

## 5. Milestones

Each milestone is a work package for a coder agent: own branch, own PR, reviewed
against the acceptance criteria before the next one starts (M2/M3 can overlap once
M1's engine API is frozen).

### M0 — Scaffold *(small)*
Vite + shadcn app boots; lint/typecheck/test/build in CI; auto-deploy to GitHub Pages.
- ✅ `npm run dev/build/test/lint` all green in CI; live URL serves the default app.

### M1 — Theme engine *(the critical one)*
`engine/` complete per §4, driven by `template.css` + analysis doc §§4–7.
- ✅ Every `DERIVED` var in `template.css` computed from its documented source.
- ✅ Ramp generator: knob shade is preserved verbatim at its slot (e.g. primary-40),
  other shades generated around it.
- ✅ Neutral + extended-palette presets implemented from `.references/colors/`.
- ✅ YAML output: hex values quoted, rgb companions omitted where HA auto-derives
  them (hex inputs), `modes: {light, dark}` structure, valid per analysis §5.
- ✅ Unit tests for color math; snapshot test of full YAML for a fixture config.

### M2 — Preview pane: tokens *(parallel-able with M3)*
Token visualization: color ramps, extended palette, font specimens, semantic tokens
(text/surfaces/status), driven by live engine output. Layout cues from
`.references/claude-design/`, simplified.
- ✅ Changing any knob visibly updates the token displays with no reload.
- ✅ Light/dark toggle flips the whole preview.

### M3 — Knob sidebar
All v1 knobs as shadcn controls, grouped per `template.css` order; font dropdowns
grouped sans/serif/display-serif/mono + system options; preset pickers with custom
escape hatches (warmth/tint sliders, OKLCH L/C sliders).
- ✅ Every `KNOB` annotation in `template.css` has a control with its specified label.
- ✅ Defaults reproduce the current HA default theme exactly.

### M4 — Preview pane: HA cards
Mock HA scene: header bar, sidebar fragment, 3–4 representative cards (entity/light
card with state colors, thermostat, sensor/graph card), form inputs, buttons, badges.
- ✅ Components use only theme variables — audit: zero hardcoded colors.
- ✅ Recognizably "Home Assistant" at a glance in both modes.

### M5 — Export & polish
YAML panel: copy button, download `themes.yaml`, theme-name field, install
instructions snippet. Responsive pass, empty/edge states, a11y pass on controls.
- ✅ Generated YAML pasted into a real HA instance renders as previewed (manual
  verification by the user — the ultimate acceptance test).

### M6 — Stretch (post-v1 backlog)
Shareable config URLs · curated starter presets · theme import · state/energy color
groups (expand/collapse, per analysis §7.2).

## 6. Ways of working

- **This session is the PM.** Plans, specs work packages, reviews PRs, does not code.
- **One milestone = one coder agent = one branch** (`feat/m1-engine`, …) **= one PR**
  into `main`. The work-package brief includes: goal, pointers into the references,
  acceptance criteria (above), and definition of done.
- **Definition of done:** CI green (lint, typecheck, tests, build) · acceptance
  criteria demonstrably met (screenshots in the PR for UI work) · no scope creep
  beyond the brief.
- **Review gate:** PM reviews each PR against acceptance criteria + a code-review
  pass; user has final merge say on anything visual (M2–M5).
- **Sequencing:** M0 → M1 → (M2 ∥ M3) → M4 → M5. Engine API frozen at end of M1;
  changes after that require a PM decision.

## 7. Open questions for the user

1. **Preview fidelity bar for M4** — are hand-built lookalike cards acceptable
   (recommended), or do you want to explore embedding real HA frontend components
   (significantly more effort, brittle across HA releases)?
2. **GitHub Pages** as the deploy target — correct?
3. **Font shortlist** — template.css says "8 sans, 4 serif, 2 display serif, 2 mono
   from Google Fonts". Do you want to pick these yourself, or should I propose a
   shortlist for your sign-off during M3?
4. **"Hearth" and "Pastel" palettes** need to be designed from scratch (template.css
   note). OK to have a design agent propose them during M1 and review them as
   swatch pages before they're baked into presets?
