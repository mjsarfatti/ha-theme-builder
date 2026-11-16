# HA variable catalogue

`ha-variables.ts` lists every CSS variable that the Home Assistant frontend declares in
`src/resources/theme/`, plus the variables that HA computes at apply time. Each entry
has the name, the tier, the light default, the dark override, the variables that its
value references, the HA source line, and the apply-time condition. The catalogue is
data only. No module imports it yet.

Line citations below refer to `home-assistant/frontend` at the commit in
`HA_FRONTEND_SHA` (`6e1fe28`). Paths are relative to that repo.

## Regenerate

```
NODE_USE_ENV_PROXY=1 node scripts/extract-ha-variables.mjs [ref]
```

The script resolves `ref` (default `dev`) to a commit SHA and reads every file at that
SHA. It writes the SHA into the file header and into `HA_FRONTEND_SHA`, so the diff of a
later run shows what HA changed. `NODE_USE_ENV_PROXY=1` is necessary only behind an HTTP
proxy. The tests do not use the network.

The script fails when a source block is empty or when `apply_themes_on_element.ts` no
longer contains a line that it cites. Then read the HA change and update the script.

## Entry fields

| Field | Meaning |
|---|---|
| `light` | Value on `html`. `null` for a variable that only dark mode or apply time sets. |
| `dark` | Value from a dark block. `null` means that the light value applies in dark mode. |
| `references` | Names in every `var(--x)` of `light` and `dark`, fallbacks included. |
| `source` | Light declaration. For a dark-only or apply-time variable, the first declaration. |
| `computed` | `default-theme`, `default-theme-dark`, `rgb-companion` or `null`. See [Apply time](#apply-time). |

When two light blocks declare the same name, the block that loads later wins, as in the
browser. The only case is `wa-shadow-l`: `wa.globals.ts:39` wins over
`color/wa.globals.ts:66` (load order `theme/theme.ts:18-20`).

The script skips the `@media (prefers-reduced-motion)` block of `core.globals.ts:59-67`.
It sets the animation durations to `1ms`, and it is not a theme default.

## Tier rule

The script applies the first rule that matches.

| # | Rule | Tier |
|---|---|---|
| 1 | Declared in `core.globals.ts`, `main.globals.ts`, `typography.globals.ts` or `color/core.globals.ts` | `core` |
| 2 | Declared in `wa.globals.ts` or `color/wa.globals.ts` | `component` |
| 3 | Name is `bar-box-shadow` or `map-filter`, or starts with `app-`, `chip-`, `codemirror-`, `data-table-`, `ha-assist-chip-`, `ha-button-`, `history-`, `input-`, `label-badge-`, `markdown-`, `mdc-`, `sidebar-`, `slider-` or `table-` | `component` |
| 4 | Every other variable: `semantic.globals.ts`, `color/semantic.globals.ts`, the rest of `color/color.globals.ts`, and `text-accent-color` (apply time only) | `semantic` |

`core` holds the raw values: ramps, spacing, radii, type scale and layout constants. HA
calls these "foundational" tokens (`color/core.globals.ts:4-10`). `semantic` holds the
values that name a role: text, surfaces, fills, status, state and the public variables.
`component` holds the values that one UI library or one widget reads.

## Cascade model

From lowest to highest priority:

1. **Base styles.** `themeStyles` concatenates the blocks in this order: `coreStyles`,
   `mainStyles`, `typographyStyles`, `semanticStyles`, `coreColorStyles`,
   `semanticColorStyles`, `colorStyles`, `waColorStyles`, fonts, `waMainStyles`,
   animations (`theme/theme.ts:13-22`, `theme/color/index.ts:24-29`). All rules target
   `html`.
2. **Dark overrides.** In dark mode, `applyThemesOnElement` starts from
   `{ ...darkSemanticVariables, ...darkColorVariables }`
   (`common/dom/apply_themes_on_element.ts:54-57`). These maps hold the `dark` values of
   this catalogue (`theme/color/index.ts:13-16`, `theme/semantic.globals.ts:24`).
3. **Theme keys.** The mode-independent keys of a YAML theme overwrite step 2
   (`apply_themes_on_element.ts:120-121`).
4. **Mode keys.** `modes.dark` or `modes.light` overwrite step 3
   (`apply_themes_on_element.ts:124-130`).

Steps 2 to 4 go into one inline style map on the element
(`apply_themes_on_element.ts:148-154`), so they win over the `html` rules of step 1.

Dark mode is on only when the theme defines `modes.dark`. A theme without `modes.dark`
always renders light. A theme with only `modes.dark` always renders dark
(`state/themes-mixin.ts:128-134`).

### Aliases are written again on every element

`derivedStyles` holds every light declaration whose value contains `var(`
(`common/style/derived-css-vars.ts:84-91`, `theme/theme.ts:24-30`). In this catalogue,
those are the entries with a non-empty `references` that come from a light block.
`processTheme` writes `derivedStyles` first and the theme keys after it
(`apply_themes_on_element.ts:164-167`). So an alias re-resolves on the element where the
theme applies. Example: a theme that sets `ha-color-primary-40` also changes
`primary-color`, because `primary-color: var(--ha-color-primary-40)` is written again on
the same element. A theme that sets `primary-color` replaces the alias. Then
`ha-color-primary-40` keeps its default.

An entry with an empty `references` is authored: HA writes it only when the theme sets it.

## YAML to CSS pipeline

1. The backend sends `themes` with one map of bare keys per theme, plus an optional
   `modes: { light, dark }`.
2. `themes-mixin.ts` picks the theme and the mode (`state/themes-mixin.ts:96-136`).
3. `applyThemesOnElement` merges the layers 2 to 4 of the cascade
   (`apply_themes_on_element.ts:54-131`).
4. `processTheme` merges `derivedStyles` under the result, adds the prefix `--` to each
   key, and adds `rgb-*` companions (`apply_themes_on_element.ts:157-198`).
5. Each property goes to `element.style.setProperty`
   (`apply_themes_on_element.ts:148-154`).

## Apply time

| `computed` | Condition | Variables | Source |
|---|---|---|---|
| `rgb-companion` | Any key in the merged map whose value starts with `#`, if the theme does not set `rgb-<key>` itself | every `rgb-*` entry | `apply_themes_on_element.ts:176-194` |
| `default-theme` | Built-in theme `default` with a profile primary or accent color | `light-primary-color`, `dark-primary-color`, `darker-primary-color`, `text-primary-color`, `text-light-primary-color`, `state-icon-color`, `text-accent-color`, `ha-color-primary-10` to `-95` | `apply_themes_on_element.ts:59-104` |
| `default-theme-dark` | The same, in dark mode | `app-header-background-color` | `apply_themes_on_element.ts:66-72` |

Facts that the engine and the export depend on:

- **A YAML theme gets only the `rgb-companion` rule.** The default-theme branch never runs
  for a YAML theme (`apply_themes_on_element.ts:59`, `:114-118`). The values in
  `derivedStyles` all contain `var(`, so HA adds a companion only for a hex value that the
  theme sets. The static `rgb-*` defaults (`color/color.globals.ts:26-36`) stay as they are
  for every other key.
- **The contrast threshold is 6.** `text-primary-color`, `text-light-primary-color` and
  `text-accent-color` become `#fff` when the contrast with `#212121` is below 6
  (`apply_themes_on_element.ts:90-103`).
- **`text-primary-color` is text on the primary color.** Its default is `#ffffff`
  (`color/color.globals.ts:10`), and `mdc-theme-on-primary` reads it (`:288`).
- **`generateColorPalette` names its steps `5, 10, … 95`.** It writes
  `ha-color-primary-5`, not `ha-color-primary-05`, and it puts the profile color at step
  50 (`common/color/palette.ts:73`). The static ramp has the default primary at step 40
  (`color/core.globals.ts:22`).
- `primary-color` and `accent-color` are copies of the profile input
  (`apply_themes_on_element.ts:78`, `:100`), so `computed` is `null` for them.
