# Theme engine

Pure TypeScript. **No React, no DOM, no I/O.** A small config of user "seeds" goes
in. The complete set of Home Assistant theme variables for light *and* dark mode
comes out, plus paste-ready YAML.

Two references drive it. `.references/template.css` is the knob spec: every variable
is either a `KNOB` that the user controls or a `DERIVED` one that we compute.
`.references/ha_theme_analysis.md` describes HA's theme system, and it is the right
source for most tasks. HA's own source is the final authority when the two conflict.
This API is frozen at the end of M1. A change to it costs a PM decision.

---

## Quick start

```ts
import { derive, toYaml, toCssProperties, DEFAULT_CONFIG } from "@/engine";

const theme = derive({
  name: "Nightshade",
  colors: { primary: "#7c5cff" },
  neutralRamp: "mauve",
});

// (a) drive a scoped preview container — never :root
for (const [prop, value] of Object.entries(toCssProperties(theme, "light"))) {
  lightPreviewEl.style.setProperty(prop, value);
}

// (b) the export panel
const yaml = toYaml(theme);
```

`derive()` accepts a partial config and fills the rest in from
`DEFAULT_CONFIG`, so `derive()` with no arguments reproduces Home Assistant's
current theme.

---

## API

### `derive(config?: PartialThemeConfig): DerivedTheme`

The entry point. Throws `TypeError` on a malformed seed color and `RangeError`
on an unknown font / ramp / palette id, or a `palette:` reference to a color
the current palette doesn't have — it never silently substitutes.

```ts
interface DerivedTheme {
  config: ThemeConfig;   // the resolved config, defaults filled in
  common: CssVarMap;     // mode-independent variables
  light: CssVarMap;      // light-only variables (does not repeat `common`)
  dark: CssVarMap;       // dark-only variables (same keys as `light`)
  ramps: { primary; red; orange; green; neutral };  // for swatch rows
  webfonts: FontOption[];  // fonts needing an extra_module_url loader (M6)
}
```

`CssVarMap` keys are **bare** names — `primary-color`, not `--primary-color` —
because that is the spelling HA's YAML uses. `common` / `light` / `dark` are
disjoint: nothing appears in more than one. `ramps.neutral` stays the
11-shade `Ramp` shape (`05..95`) this always was, even though the preset
data behind it now carries 13 shades — see [Neutral slots reach 00 and
100](#neutral-slots-reach-00-and-100). The two extra shades are neutral-only
internal data for `surfaces()` and `borderColor`, not swatch-row data.

### `modeVars(theme, mode): CssVarMap`

One fully-resolved map for a single mode (`common` merged with that mode's
overrides).

### `toCssProperties(theme, mode): CssVarMap`

The same map, keys prefixed with `--`, ready for `element.style.setProperty()`.

### `toYaml(theme, options?): string`

Serializes to a Home Assistant theme.

```ts
interface ToYamlOptions {
  name?: string;                    // defaults to config.name
  wrapper?: "none" | "frontend";    // "none" = themes.yaml; "frontend" = configuration.yaml
  header?: boolean;                 // provenance + web-font comment. default true
  comments?: boolean;               // section headings. default true
}
```

### `resolveConfig(partial?): ThemeConfig` · `DEFAULT_CONFIG`

Config helpers, exported so the UI store can share one notion of "the default".
`derive()` with no arguments uses it, and that is exactly what the app shows on
load — see below.

### Home Assistant Refined

`DEFAULT_CONFIG` is **not** the theme HA ships today. It is `template.css`, a
redesign. About 40 variables per mode differ from stock, because a few values
moved onto the ramps:

- `neutral-95` for the page background, instead of `#fafafa`, a value not on any ramp
- primary-30, primary-20 and primary-50 for the legacy Material blues
- `--ha-color-neutral-05` instead of black as the shadow base

It is the only theme the product models (PLAN.md §3 decision 9).

### Color utilities

`generateRamp`, `rampEntries` · `normalizeHex`, `isHex`, `opaqueHex`,
`hexToRgb`, `rgbToHex`, `rgbTriplet`, `withAlpha`, `alphaOf`, `hexToOklch`,
`oklchToHex` · `rgb2lab`, `lab2rgb`, `labBrighten`, `labDarken`, `brighten`,
`darken`, `luminosity`, `rgbContrast`, `contrastRatio`, `contrastingText`.

### Preset data

`FONTS`, `FONT_CATEGORY_LABELS`, `getFont` · `NEUTRAL_RAMPS`, `getNeutralRamp` ·
`EXTENDED_PALETTES`, `getExtendedPalette`, `PALETTE_COLOR_NAMES` ·
`REFERENCE_RAMPS`, `KNOB_SLOT`, `HA_PRIMARY_RAMP` and friends.

---

## The config

```ts
interface ThemeConfig {
  name: string;
  fonts: { body; heading; longform; code };   // FontId, see FONTS
  colors: {
    primary;   // seed for --ha-color-primary-40
    error;     // seed for --ha-color-red-50
    warning;   // seed for --ha-color-orange-70
    success;   // seed for --ha-color-green-60
    accent;    // --accent-color, standalone
    info;      // --info-color, standalone
  };             // each one a SeedColor: Hex | `palette:${PaletteColorName}`
  neutralRamp: NeutralRampId;              // "ha" | "gray" | "slate" | …
  palette: ExtendedPaletteId;              // "ha" | "tailwind-v4" | …
  borderColor: NeutralSlotId | "match-card"; // "neutral-00" … "neutral-100", or the card colour
  cardBackground: SurfaceChoice;           // "neutral-100" | "neutral-95" | "neutral-90" | "neutral-80"
  primaryBackground: SurfaceChoice;
}
```

Every field stays JSON-serializable — a `SeedColor` and a `borderColor` are
both just strings — so the whole config still round-trips through a URL.

### `SeedColor`: a literal hex, or a reference that follows a palette preset

Each of the six `colors.*` fields is a `SeedColor`:

```ts
type PaletteRef = `palette:${PaletteColorName}`;   // e.g. "palette:red"
type SeedColor = Hex | PaletteRef;
```

A literal hex behaves exactly as before. A `palette:${name}` reference
resolves against the config's own `palette` field, every time `derive()`
runs — so a knob set this way tracks the palette preset: change `palette`
from `"ha"` to `"tailwind-v4"` and every reference on the config re-resolves
to that preset's own colour for the same name, with no re-save needed.
`derive()` resolves every reference before any ramp math runs, and it
resolves it fresh each call — `theme.config.colors.*` always echoes back
whatever the caller passed in, reference or literal, never the resolved hex.

A reference can only name one of the 18 static `PaletteColorName` entries
(`"red"`, `"blue"`, …) — never `primary`, `red`, `orange` or `green` as a
*ramp*. Those four ramps (`generateRamp()`) are generated **from** these same
`colors.*` seeds, so a reference into one of them would have no fixed point
to resolve to before the ramp exists. `PaletteRef`'s own type makes that
reference impossible to construct; `resolveSeed()` in `derive.ts` only has to
guard against a malformed string reaching it past a type assertion, and
throws `RangeError` when it does (the same behavior `getFont` /
`getNeutralRamp` / `getExtendedPalette` show for an unknown id). Note that
`Hex` is a plain `string` alias like the rest of this codebase's colour
types, so this is a runtime check, not a compile-time one — same as
`normalizeHex` throwing on a malformed hex today.

### `borderColor`'s `"match-card"` sentinel

`"match-card"` is not a colour — it is an instruction to read the *current
mode's own, already-computed* `card-background-color` instead of a ramp
slot. This is what lets the border "disappear" into the card (the UI calls
this option **Invisible**). It resolves to the literal per-mode card value
`surfaces()` computes for `card-background-color` — never a ramp lookup, and
never `mirrorSlot()`. See [Backgrounds and the border knob](#backgrounds-and-the-border-knob)
below for why a ramp-based mirror would give the wrong hex here.

That is exactly the `KNOB` set in `template.css`, minus the custom-preset
options PLAN.md §3 decision 6 defers to M7.

---

## How colors are derived

### Ramps (`ramps.ts`)

Each of primary / red / orange / green ships an 11-shade `05..95` ramp. The user
sets **one** shade: the `KNOB` slot for that family (primary-40, red-50,
orange-70, green-60). The generator builds the other ten. It transfers the shape
of HA's own ramp for that family onto the seed, in **OKLCH**:

- **hue** rotated by the seed's offset from the reference at that slot
- **chroma** scaled by the seed's ratio to the reference, so a muted seed gives a
  muted ramp
- **lightness** re-anchored piecewise — the shades below the seed remapped onto
  `[darkest, seedL]`, the shades above onto `[seedL, lightest]` — which keeps the
  ramp monotonic and keeps 05 dark enough to use as text and 95 light enough to
  use as a background tint.

Out-of-gamut results are mapped back into sRGB by reducing chroma at constant
lightness and hue.

Two guarantees, both tested:

- **The seed stays exact** at its own slot. Round-tripping a seed through
  the generator returns the exact input hex, never a re-quantized approximation.
- **A seed equal to the reference returns the reference ramp untouched**, so the
  default config reproduces HA's shipped ramps byte for byte.

The neutral ramp and the extended palette are *presets*, not generated —
transcribed 1:1 from `.references/colors/`.

### HA parity (`ha-math.ts`)

`rgb2lab` / `lab2rgb` / `labBrighten` / `labDarken` / `rgbContrast` are hand
ports of HA's own `src/common/color/`. They use the chroma.js D65 white point
that HA uses (Xn 0.95047 / Zn 1.08883), not culori's, so parity is exact.

`contrastingText()` implements HA's on-color text rule and drives
`--text-primary-color`, `--text-light-primary-color` and `--text-accent-color`.
**The threshold is 6, not 4.5.** `ha_theme_analysis.md` §7.5 says 4.5 in prose,
but §7.3's pseudocode says `< 6`. §7.3 is right. HA's default primary `#009ac7`
scores 4.95 against `#212121`, and HA ships `#ffffff` for
`--text-primary-color`. Only the threshold of 6 gives that result.

### Dark mode

The engine derives dark mode in the same pass. Mode-independent variables live in
`common`: ramps, palette, brand and status colors, fonts, and energy colors. Only
surfaces, text, lines, inputs, shadows, the scrollbar and the entity-icon color
differ per mode. That split matches HA's own dark layer. HA overrides backgrounds,
text, input colors and shadows, and leaves `--primary-color` alone (§3.2).

The neutral ramp itself never inverts. What inverts is *which slot* each role
reads from: `mirrorSlot(s) = 100 - s`, the same inversion HA's
`darkSemanticColorStyles` performs (§2.2). `mirrorSlot` is generic over both
slot domains this engine has, because both are symmetric about 50: the shared
05..95 `RampSlot` scale (the scrollbar and the entity icon read this way) and
the neutral ramp's own extended 00..100 `NeutralRampSlot` scale the border
knob reads this way, since `borderColor` can itself be `neutral-00` or
`neutral-100` (see [Neutral slots reach 00 and
100](#neutral-slots-reach-00-and-100)). One formula covers 05↔95 and 00↔100
alike. Exceptions, all deliberate:

| Variable | Rule |
|---|---|
| `primary-text-color` | pure `white` in dark, per HA's documented override |
| `secondary-text-color` | `neutral-80` in dark, per HA's documented override |
| `disabled-text-color` | `neutral-50`, in the same "lighter than a plain mirror" direction as the two above. `mirrorSlot(60)` drops it to 2.1:1, where light mode gives 3.0:1 |
| `shadow-color`, `ha-box-shadow-*` | fixed at `neutral-05` in **both** modes, and independent of the border knob — a shadow is an absence of light, so it must not flip pale and must not tint with the border. Only the alpha rises, to the values §2.6/§6 document for HA's dark theme. See [Backgrounds and the border knob](#backgrounds-and-the-border-knob) |
| backgrounds, border | derived jointly, see below |

### Neutral slots reach 00 and 100

The neutral ramp's own slot type, `NeutralRampSlot`, is 13 shades — `00,
05, 10, … 90, 95, 100` — not the 11-shade `RampSlot` the generated
primary/red/orange/green ramps share. `.references/colors/black-white-ramps.html`
carries real, untinted reference data at both new ends: every one of the ten
presets — including the tinted ones like Mauve — ships `#000000` at slot 0
and `#ffffff` at slot 100 (`presets.test.ts` checks this explicitly). Slots 0
and 100 are what a "black" or "white" knob option actually *is*: not a value
off the ramp, but the ramp's own darkest and lightest real shades.

This is deliberately its own type, not an extension of `RampSlot`: the other
four ramps are generated (`generateRamp()`, `ramps.ts`) and have no reference
data at those extremes, so widening the shared type would force every
`Record<RampSlot, Hex>` — `HA_PRIMARY_RAMP` among them — to also carry slots
it cannot supply. `NeutralSlotId` (the string form the config uses,
`"neutral-00"` … `"neutral-100"`) grew the same two entries to match.
`SurfaceChoice` moved into this same slot space as a consequence:
`"white"` is now `"neutral-100"`, a real slot rather than a special case
tacked one rung above the ramp.

### Backgrounds and the border knob

**Card, page and secondary backgrounds are derived jointly, not one at a
time**, and the border knob's `"match-card"` option reads directly out of
that joint result. Both live in `surfaces()`.

**The rule, in plain language:** find whichever of the card and the page is
*darker* in light mode. Mirror that one's own position on the ramp — same
`100 - slot` inversion as everything else in dark mode — to get its dark-mode
position. Then place the *other* surface the same number of ramp steps away
from that anchor, moving toward the lighter end. The number of steps between
card and page — the "gap" the user's two choices express — stays the same in dark
mode; so does which one is on top. If the user picked the same
slot for both, both mirror to that same anchor and the gap is zero.

**Why anchor on the darker one, specifically.** Home Assistant's own theme
keeps the card *lighter* than the page in both modes: light `#fafafa` page /
`#ffffff` card, dark `#111111` page / `#1c1c1c` card
(`color.globals.ts:46-47`, `:342-343`). Mirroring both surfaces
independently preserves the *distance* between them but reverses which one
sits on top — the dark card sinks below the dark page for every ordinary
choice, including the default. Anchoring on the darker surface and deriving
the other by addition is also the clamp-safe direction: the derived value
only ever moves further from the ramp's dark floor, never past it. Anchoring
on the *lighter* surface instead can put the other value's index below zero — a
`neutral-95` page under a `neutral-100` card would mirror the card to slot 0,
and the page would then need to derive to slot −5, which doesn't exist.

**Index space, not slot numbers.** The neutral ramp's 13 slots are unevenly
spaced at both ends (`0, 5, 10, 20, … 90, 95, 100`), so subtracting *slot
numbers* can produce a value with no matching slot, like `neutral-15`. All of
`surfaces()`'s arithmetic — the mirror, the gap, the "same number of steps"
— runs on each slot's *position* in that 13-element array instead (`0`
through `12`), the same thing `mirrorSlot` does implicitly by relying on the
array being symmetric about its middle. `neutralRampAt()` is the lookup that
turns a position back into a hex, and it is where the clamp lives.

**The clamp, and what happens at the edge.** `neutralRampAt()` clamps any
position outside `0..12` to the nearest end, rather than throwing or reading
past the array. That is a deliberate choice, not an incidental one: at that
boundary, the derived surface can equal the exact same slot as its anchor
— the two backgrounds collapse onto one colour. This is not a new failure
mode; it is the same thing that already happens on purpose when the user
picks an equal slot for both choices in light mode (gap zero). Today's four
`SurfaceChoice` values (`neutral-80`, `-90`, `-95`, `-100`) never actually
reach that clamp: checked across all sixteen ordered pairs, the widest gap
any two of them can express is 3 slot-positions, the anchor always lands
between positions 0 and 3, and the derived surface between 0 and 6 — nowhere
near the `0..12` boundary. The clamp exists for a `SurfaceChoice` union that
might one day include slots nearer the ramp's own ends.

**`secondary-background-color`** keeps the same relationship to card and page
this always had — one ramp step below the darker of the two in light mode,
two steps above the page (and never level with the card) in dark mode, per
HA's own dark ordering `#111111` (page) `< #1c1c1c` (card) `< #282828`
(secondary), §2.3/§2.6. That rule did not change; only the index space
underneath it did, along with everything else once `SurfaceChoice` moved
into slot space (above).

**`borderColor`'s `"match-card"` reads `surface.card` directly**, the exact
per-mode value this section just described — never a ramp lookup, and never
`mirrorSlot()`. The dark card is a *joint* function of both surface knobs
under the rule above, not a mirror of the light card's own slot in
isolation, so a per-slot mirror gives a different — and wrong — hex here. A
concrete case: the default config's card is `neutral-100`. `mirrorSlot(100)`
is `neutral-00`, pure black. The actual dark card `surfaces()` computes is
`#202020` (`neutral-10`). `derive.ts` reuses the one, real, already-computed
card value; it does not add a second way to compute a card color.

---

## Deviations from `template.css`

The default config reproduces `template.css` exactly, except in the places below.
`derive.test.ts` parses the real `template.css`. It asserts that the non-deviating
variables match, and that this list is exhaustive and still accurate. If a change
makes one of these match again, the suite fails and the entry has to go.

These are deviations from the *spec file*. They come in addition to the 40 per mode by
which `template.css` itself already departs from stock HA — see
[Home Assistant Refined](#home-assistant-refined).

1. **Shadows, inputs and lines are neutral-05-based, not black-based.** Required
   by the `NOTE:` comments ("Derive using `--ha-color-neutral-05` as base in
   place of `000000`"). `template.css` still shows today's black values. With a
   tinted ramp such as Mauve this is the point: shadows and hairlines pick up the
   tint. 17 variables.

2. **`text-primary-color` / `text-light-primary-color` use HA's WCAG check**,
   not the aliases `template.css` writes (`var(--primary-text-color)` and
   `var(--secondary-text-color)`). Those aliases contradict HA's own shipped
   defaults. HA ships `#ffffff` and `#212121`. `template.css` produces `#141414`
   and `#5e5e5e`. `--text-primary-color` means "text *on* the primary color", and
   it backs `--mdc-theme-on-primary`. The aliases look like a copy and paste
   artifact. The contrast rule reproduces both HA defaults exactly.

3. **`primary-background-color` derives to `#f3f3f3`, not `#fafafa`.** The
   knob's `NOTE:` restricts the control to "Neutral Ramp 80, 90, 95 + white", and
   `#fafafa` is not on any neutral ramp. `neutral-95` is the nearest on-ramp
   value, and `secondary-background-color` follows at `#e6e6e6`, one unit off
   stock HA's `#e5e5e5`.

4. **The `rgb-*` values are recomputed from our own colors.** `template.css`'s
   `rgb-*` literals come from HA's legacy palette and do not match
   `template.css`'s own values. It says `rgb-error-color: 219, 68, 55`, the old
   `#db4437`, while its `--error-color` is `#dc3146`. The engine derives each
   companion from the value it accompanies. A test asserts that every companion
   agrees with its base.

### One thing the brief asked for that we do *not* do

`--dark-primary-color`, `--darker-primary-color` and `--light-primary-color` are
bound to ramp slots 30 / 20 / 50, as `template.css` specifies — **not** to HA's
Lab brighten/darken. Those Lab derivations run only in HA's *built-in* theme path,
never for a YAML theme (§4.1 step 4). HA's own shipped values for these three are
legacy Material constants, not derivations of `#009ac7`. A bind to the ramp also
makes the whole family move together when the user changes the primary seed.
That behavior is the product's core idea. The Lab functions are implemented, exported and
tested for parity anyway. `contrastingText` uses them, and future work can too.

---

## YAML output

- **Every value is quoted.** Unquoted `#` starts a YAML comment, so
  `primary-color: #009ac7` parses as an empty key (§5.5). Double quotes by
  default, single quotes for font stacks that already contain double quotes.
- **`modes: { light, dark }`**, with mode-independent variables at the top level.
  Defining both modes is what lets the user toggle in their profile (§5.4).
- **Bare keys**, no `--` prefix.
- **`rgb-*` companions are omitted wherever HA derives them itself** — that is,
  wherever the base value starts with `#` (§4.1 step 5, §5.5's "hex only" rule).
  With the current variable set they all qualify, so the engine emits none. The
  rule is generic, and a test proves that a non-hex base gets its companion back.
- **Grouped and commented** like `template.css`, so the two can be read side by
  side and a user can understand what they are pasting.

Tests parse the output with a real YAML parser and assert it round-trips back to
the engine's own variable map.

---

## Preset provenance

`presets/neutral-ramps.ts` and `presets/palettes.ts` are **generated**, not typed
by hand. `scripts/extract-presets.mjs` parses the `const rows = [...]` literal
and the `<th data-col>` header row out of the two reference pages in
`.references/colors/` and writes the TS. Re-run with:

```
node scripts/extract-presets.mjs
```

`presets.test.ts` re-parses those same pages independently and diffs every cell
against the committed data, so a hand edit or a bad regeneration cannot go
undetected. It also asserts the Home Assistant column of each table matches
`template.css`.

`black-white-ramps.html`'s `black` and `white` rows feed `neutral-00` and
`neutral-100` the same way its `neutral-05`..`neutral-95` rows feed the rest
of the ramp — they used to be filtered out by a name check
(`name.startsWith("neutral-")`); the extractor and the independent re-parse
in `presets.test.ts` both changed to include them. `presets.test.ts`'s
independent re-parse is the actual proof the data is right, since it reads
the reference HTML itself rather than trusting either the extractor or its
own output.

The app never parses HTML at runtime.

---

## Dependencies

One: [`culori`](https://culorijs.org) 4.0.2, for OKLCH conversion and sRGB gamut
mapping. Well maintained, dependency-free, tree-shakeable, and the standard
choice for CSS Color 4 work. Our own OKLab matrices and gamut-mapping binary
search are more code and more risk for no gain.

It is *not* used for the HA-parity math — see `ha-math.ts` above.

One correctness note about it. `clampChroma` decides gamut membership with a
JND-based binary search. Colors that sit exactly on the sRGB boundary lose chroma
even though sRGB represents them exactly: `#0000ff` comes back as `#0031e5`.
`oklchToHex` therefore passes a color to chroma reduction only when it is out of
gamut by more than a rounding error. A test
round-trips 2000 deterministic random colors to keep that honest.

---

## Tests

`src/engine/__tests__/`, 150 tests across six files:

| File | Covers |
|---|---|
| `color.test.ts` | hex parsing and normalization, alpha helpers, OKLCH round-trips (including a 2000-color sweep), gamut mapping, clamping |
| `ha-math.test.ts` | Lab conversions against published CIE values, `Kn = 18` brighten/darken, WCAG luminance and contrast against known answers, the contrast threshold and where it flips |
| `ramps.test.ts` | seed survival at every slot, identity, monotonicity, hue/chroma transfer, and the edge cases: pure black, pure white, fully saturated seeds, achromatic seeds, seeds already at a ramp endpoint, an achromatic reference |
| `presets.test.ts` | preset data re-parsed from the reference pages and diffed cell by cell, including the `neutral-00`/`neutral-100` rows. Font shortlist. HA columns against `template.css` |
| `derive.test.ts` | the `template.css` regression net, knob → variable wiring, light/dark rules, contrast floors, elevation across all 16 background combinations, palette-reference resolution (follows the preset; a literal hex does not), `match-card`, the `surfaces()` anchor rule at both directions and the equal case, the widest gap today's `SurfaceChoice` values reach, and the `neutralRampAt` clamp boundary itself |
| `yaml.test.ts` | quoting rules through a real YAML parser, structure, the rgb-omission rule, and file snapshots of three complete themes |

The snapshots live in `__tests__/__snapshots__/*.yaml` and are readable as YAML,
so a diff in review shows the actual theme change.

Run `pnpm test` (`vitest run`) from the repo root. If you're running vitest
directly rather than through the `pnpm test` script and this checkout has
other Claude Code sessions' worktrees under `.claude/worktrees/`, exclude
that path explicitly (`vite.config.ts`'s `test.exclude` already does this for
the `pnpm test` script) — vitest's own default excludes don't cover
dot-directories other than `.git`, so it will otherwise discover and run
those other sessions' test files too, against whatever mid-edit state their
own branches happen to be in.
