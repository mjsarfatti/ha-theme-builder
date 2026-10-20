# Theme engine

The engine is pure TypeScript. It has no React, no DOM, and no I/O. A small config of
user "seeds" goes in. The complete set of Home Assistant theme variables for light *and*
dark mode comes out, plus paste-ready YAML.

Two references drive the engine:

- `.references/template.css` is the knob spec. Every variable is either a `KNOB` that
  the user controls or a `DERIVED` variable that the engine computes.
- `.references/ha_theme_analysis.md` describes the HA theme system. It is correct for
  most tasks. HA's own source is the final authority when the two conflict.

The API is frozen at the end of M1. A change to the API requires a PM decision.

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

`derive()` accepts a partial config and fills the remaining fields from
`DEFAULT_CONFIG`. `derive()` with no arguments returns the Home Assistant Refined
theme (see [Home Assistant Refined](#home-assistant-refined)).

---

## API

### `derive(config?: PartialThemeConfig): DerivedTheme`

`derive()` is the entry point. It throws these errors:

- `TypeError` for a malformed seed color.
- `RangeError` for an unknown font, ramp or palette id.
- `RangeError` for a `palette:` reference to a color that the current palette does not
  have.

`derive()` never substitutes a value silently.

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

`CssVarMap` keys are **bare** names (`primary-color`, not `--primary-color`), because
HA's YAML uses that spelling. `common`, `light` and `dark` are disjoint: a variable
appears in only one of them.

`ramps.neutral` has the 11-shade `Ramp` shape (`05..95`). The preset data behind it has
13 shades (see [Neutral slots reach 00 and 100](#neutral-slots-reach-00-and-100)). The
two extra shades are internal data for `surfaces()` and `borderColor`. They are not
swatch-row data.

### `modeVars(theme, mode): CssVarMap`

`modeVars()` returns one fully resolved map for a single mode: `common` merged with the
overrides of that mode.

### `toCssProperties(theme, mode): CssVarMap`

`toCssProperties()` returns the same map with keys that have the prefix `--`. The keys
are ready for `element.style.setProperty()`.

### `toYaml(theme, options?): string`

`toYaml()` serializes the theme to a Home Assistant theme.

```ts
interface ToYamlOptions {
  name?: string;                    // defaults to config.name
  wrapper?: "none" | "frontend";    // "none" = themes.yaml; "frontend" = configuration.yaml
  header?: boolean;                 // provenance + web-font comment. default true
  comments?: boolean;               // section headings. default true
}
```

### `resolveConfig(partial?): ThemeConfig` · `DEFAULT_CONFIG`

These config helpers are exported so that the UI store shares one definition of "the
default". `derive()` with no arguments uses `DEFAULT_CONFIG`. The app shows this
config on load (see below).

### Home Assistant Refined

`DEFAULT_CONFIG` is the `template.css` redesign of the theme that HA ships. 40
variables per mode differ from stock HA, because the redesign places a few values on
the ramps:

- `neutral-95` for the page background, where stock HA uses `#fafafa`, a value that is
  on no ramp
- primary-30, primary-20 and primary-50 for the legacy Material blues
- `--ha-color-neutral-05` as the shadow base, where stock HA uses black

Home Assistant Refined is the only theme that the product models (PLAN.md §3 decision
9).

### Color utilities

`generateRamp`, `rampEntries` · `normalizeHex`, `isHex`, `opaqueHex`,
`hexToRgb`, `rgbToHex`, `rgbTriplet`, `withAlpha`, `alphaOf`, `hexToOklch`,
`oklchToHex` · `rgb2lab`, `lab2rgb`, `labBrighten`, `labDarken`, `brighten`,
`darken`, `luminosity`, `rgbContrast`, `contrastRatio`, `contrastingText`.

### Preset data

`FONTS`, `FONT_CATEGORY_LABELS`, `getFont` · `NEUTRAL_RAMPS`, `getNeutralRamp` ·
`EXTENDED_PALETTES`, `getExtendedPalette`, `PALETTE_COLOR_NAMES` ·
`REFERENCE_RAMPS`, `KNOB_SLOT`, `HA_PRIMARY_RAMP` and related exports.

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
  borderColor: NeutralSlotId | "match-card"; // "neutral-00" … "neutral-100", or the card color
  cardBackground: SurfaceChoice;           // "neutral-100" | "neutral-95" | "neutral-90" | "neutral-80"
  primaryBackground: SurfaceChoice;
}
```

Every field is JSON-serializable. A `SeedColor` and a `borderColor` are both strings,
so the whole config round-trips through a URL.

The `KNOB` set in `template.css` defines these fields, without the custom-preset
options that PLAN.md §3 decision 6 assigns to M7.

### `SeedColor`: a literal hex, or a reference that follows a palette preset

Each of the six `colors.*` fields is a `SeedColor`:

```ts
type PaletteRef = `palette:${PaletteColorName}`;   // e.g. "palette:red"
type SeedColor = Hex | PaletteRef;
```

A literal hex is a fixed color. A `palette:${name}` reference resolves against the
`palette` field of the same config. `derive()` resolves the reference on every call.
A knob that holds a reference tracks the palette preset. When `palette` changes from
`"ha"` to `"tailwind-v4"`, every reference on the config resolves to the color with
the same name in the new preset. The config does not need a new save.

`derive()` resolves every reference before the ramp math runs. `theme.config.colors.*`
always returns the value that the caller passed in (a reference or a literal), not the
resolved hex.

A reference can name only one of the 18 static `PaletteColorName` entries (`"red"`,
`"blue"`, …). A reference cannot name `primary`, `red`, `orange` or `green` as a
*ramp*. `generateRamp()` generates those four ramps **from** the `colors.*` seeds, so a
reference into one of them has no fixed point to resolve to before the ramp exists.

The `PaletteRef` type makes such a reference impossible to construct. `Hex` is a plain
`string` alias, like the other color types in this codebase. For that reason, the
guard in `resolveSeed()` in `derive.ts` is a runtime check, not a compile-time check.
`resolveSeed()` throws `RangeError` for a malformed string that reaches it past a type
assertion. `getFont`, `getNeutralRamp` and `getExtendedPalette` throw the same error
for an unknown id, and `normalizeHex` throws on a malformed hex.

### `borderColor`'s `"match-card"` sentinel

`"match-card"` is an instruction, not a color. It tells the engine to read the
*already computed* `card-background-color` of the current mode instead of a ramp slot.
The border then blends into the card. The UI calls this option **Invisible**.

`"match-card"` resolves to the literal per-mode card value that `surfaces()` computes
for `card-background-color`. It is never a ramp lookup and never `mirrorSlot()`. A
ramp-based mirror gives the wrong hex (see
[Backgrounds and the border knob](#backgrounds-and-the-border-knob)).

---

## How colors are derived

### Ramps (`ramps.ts`)

The primary, red, orange and green families each have an 11-shade `05..95` ramp. The
user sets **one** shade: the `KNOB` slot of the family (primary-40, red-50, orange-70,
green-60). The generator builds the other ten shades. It transfers the shape of HA's
own ramp for that family onto the seed, in **OKLCH**:

- **hue:** rotated by the offset of the seed from the reference at that slot
- **chroma:** scaled by the ratio of the seed to the reference, so a muted seed gives
  a muted ramp
- **lightness:** re-anchored piecewise. The shades below the seed map onto
  `[darkest, seedL]`. The shades above the seed map onto `[seedL, lightest]`. This
  keeps the ramp monotonic, keeps 05 dark enough for text, and keeps 95 light enough
  for a background tint.

The generator maps out-of-gamut results back into sRGB. It reduces chroma at constant
lightness and hue.

Two guarantees have tests:

- **The seed stays exact** at its own slot. A seed that goes through the generator
  returns the exact input hex, not a re-quantized approximation.
- **A seed equal to the reference returns the reference ramp unchanged.** The default
  config therefore reproduces HA's shipped ramps byte for byte.

The neutral ramp and the extended palette are *presets*. The engine does not generate
them. They are transcribed 1:1 from `.references/colors/`.

### HA parity (`ha-math.ts`)

`rgb2lab`, `lab2rgb`, `labBrighten`, `labDarken` and `rgbContrast` are manual ports of
HA's own `src/common/color/`. They use the chroma.js D65 white point that HA uses (Xn
0.95047 / Zn 1.08883). They do not use the culori white point. The results match HA
exactly.

`contrastingText()` implements the on-color text rule of HA. It drives
`--text-primary-color`, `--text-light-primary-color` and `--text-accent-color`.
**The threshold is 6.** `ha_theme_analysis.md` §7.3 gives the threshold `< 6` in its
pseudocode, and that value is correct. The prose in §7.5 gives 4.5, which is wrong. HA's
default primary `#009ac7` scores 4.95 against `#212121`, and HA ships `#ffffff` for
`--text-primary-color`. Only the threshold 6 gives that result.

### Dark mode

The engine derives dark mode in the same pass as light mode. Mode-independent
variables are in `common`: ramps, palette, brand and status colors, fonts, and energy
colors. Only these variables differ per mode: surfaces, text, lines, inputs, shadows,
the scrollbar and the entity-icon color. This split matches the dark layer of HA. HA
overrides backgrounds, text, input colors and shadows, and keeps `--primary-color`
(§3.2).

The neutral ramp never inverts. The slot that each role reads from inverts:
`mirrorSlot(s) = 100 - s`. HA's `darkSemanticColorStyles` performs the same inversion
(§2.2). `mirrorSlot` works on both slot domains of this engine, because both are
symmetric about 50:

- the shared 05..95 `RampSlot` scale (the scrollbar and the entity icon read this way)
- the extended 00..100 `NeutralRampSlot` scale of the neutral ramp (the border knob
  reads this way, because `borderColor` can be `neutral-00` or `neutral-100`; see
  [Neutral slots reach 00 and 100](#neutral-slots-reach-00-and-100))

One formula covers 05↔95 and 00↔100. These exceptions are deliberate:

| Variable | Rule |
|---|---|
| `primary-text-color` | pure `white` in dark, per the documented override of HA |
| `secondary-text-color` | `neutral-80` in dark, per the documented override of HA |
| `disabled-text-color` | `neutral-50`. It is lighter than a plain mirror, in the same direction as the two rows above. `mirrorSlot(60)` gives 2.1:1, and light mode gives 3.0:1 |
| `shadow-color`, `ha-box-shadow-*` | fixed at `neutral-05` in **both** modes, independent of the border knob. A shadow is an absence of light, so it must not turn pale and must not take the tint of the border. Only the alpha rises, to the values that §2.6/§6 document for the HA dark theme. See [Backgrounds and the border knob](#backgrounds-and-the-border-knob) |
| backgrounds, border | derived jointly, see below |

### Neutral slots reach 00 and 100

The slot type of the neutral ramp, `NeutralRampSlot`, has 13 shades: `00, 05, 10, …
90, 95, 100`. The generated primary, red, orange and green ramps share the 11-shade
`RampSlot` type instead.

`.references/colors/black-white-ramps.html` has real, untinted reference data at both
new ends. All ten presets, including the tinted presets such as Mauve, have `#000000` at
slot 0 and `#ffffff` at slot 100. `presets.test.ts` checks this. Slots 0 and 100 are
the darkest and lightest real shades of the ramp. They are what a "black" or "white"
knob option is.

`NeutralRampSlot` is a separate type. `RampSlot` is not extended, because the four
generated ramps (`generateRamp()`, `ramps.ts`) have no reference data at those
extremes. A wider shared type would force every `Record<RampSlot, Hex>`, such as
`HA_PRIMARY_RAMP`, to carry slots that it cannot supply.

`NeutralSlotId` is the string form that the config uses: `"neutral-00"` …
`"neutral-100"`. It has the same two extra entries. `SurfaceChoice` uses the same slot
space. `"neutral-100"` is a real slot, and `"white"` is not a value.

### Backgrounds and the border knob

**The engine derives the card, page and secondary backgrounds jointly.** The
`"match-card"` option of the border knob reads directly from that joint result. Both
live in `surfaces()`.

**The rule:**

1. Find the darker of the card and the page in light mode.
2. Mirror the ramp position of that surface with the `100 - slot` inversion that the
   rest of dark mode uses. The result is its dark-mode position.
3. Place the *other* surface the same number of ramp steps from that anchor, toward the
   lighter end.

The number of steps between card and page (the "gap" of the two user choices) stays the
same in dark mode, and the order of the surfaces stays the same. If the user picks the
same slot for both, both surfaces mirror to the same anchor and the gap is zero.

**Why the anchor is the darker surface.** The HA theme keeps the card *lighter* than the
page in both modes. Light mode uses `#fafafa` for the page and `#ffffff` for the card.
Dark mode uses `#111111` for the page and `#1c1c1c` for the card
(`color.globals.ts:46-47`, `:342-343`). If the engine mirrors both surfaces
independently, it keeps the *distance* between them but reverses the order. For every
ordinary choice, including the default, the dark card falls below the dark page.

The anchor on the darker surface also gives the clamp-safe direction. The derived value
moves only away from the dark floor of the ramp, never past it. An anchor on the
*lighter* surface can put the other value below index zero. A `neutral-95` page under a
`neutral-100` card is an example. The card mirrors to slot 0, and the page needs slot
−5, which does not exist.

**Index space, not slot numbers.** The 13 slots of the neutral ramp have uneven
spacing at both ends (`0, 5, 10, 20, … 90, 95, 100`). A subtraction of *slot numbers*
can give a value with no slot, such as `neutral-15`. All arithmetic in `surfaces()`
(the mirror, the gap, the "same number of steps") therefore runs on the *position* of
each slot in the 13-element array (`0` through `12`). `mirrorSlot` does the same
implicitly, because the array is symmetric about its middle. `neutralRampAt()` turns a
position back into a hex, and the clamp lives in this function.

**The clamp.** `neutralRampAt()` clamps a position outside `0..12` to the nearest end.
It does not throw and does not read past the array. At the boundary, the derived surface
can equal the slot of its anchor, and the two backgrounds become one color. This is the
same result as the deliberate case in which the user picks an equal slot for both
choices in light mode (gap zero).

The four current `SurfaceChoice` values (`neutral-80`, `-90`, `-95`, `-100`) never reach
the clamp. Across all sixteen ordered pairs, the widest gap is 3 slot-positions. The
anchor is always between positions 0 and 3, and the derived surface is between 0 and 6.
The clamp is for a future `SurfaceChoice` union that contains slots nearer the ends of
the ramp.

**`secondary-background-color`** keeps its relationship to card and page:

- Light mode: one ramp step below the darker of the two.
- Dark mode: two steps above the page, and never level with the card.

This matches the dark ordering of HA: `#111111` (page) `< #1c1c1c` (card) `< #282828`
(secondary), §2.3/§2.6. The rule works in the same index space as the rest of
`surfaces()`.

**`borderColor`'s `"match-card"` reads `surface.card` directly.** This is the exact
per-mode value that this section describes. It is never a ramp lookup and never
`mirrorSlot()`. The dark card is a *joint* function of both surface knobs. It is not a
mirror of the light card slot alone, so a per-slot mirror gives a different and wrong
hex. Example: the default config has the card at `neutral-100`. `mirrorSlot(100)` is
`neutral-00`, pure black. The dark card that `surfaces()` computes is `#202020`
(`neutral-10`). `derive.ts` reuses this one already-computed card value. It has no
second way to compute a card color.

---

## Deviations from `template.css`

The default config reproduces `template.css` exactly, except for the deviations below.
`derive.test.ts` parses the real `template.css`. It asserts two things: the
non-deviating variables match, and this list is exhaustive and accurate. When a change
makes a listed variable match again, the suite fails and the entry must be removed.

These are deviations from the *spec file*. They add to the 40 variables per mode in
which `template.css` itself departs from stock HA (see
[Home Assistant Refined](#home-assistant-refined)).

1. **Shadows, inputs and lines are neutral-05-based.** The `NOTE:` comments require
   this ("Derive using `--ha-color-neutral-05` as base in place of `000000`").
   `template.css` shows black values. With a tinted ramp such as Mauve, shadows and
   hairlines take the tint. 17 variables.

2. **`text-primary-color` and `text-light-primary-color` use the WCAG check of HA.**
   `template.css` writes the aliases `var(--primary-text-color)` and
   `var(--secondary-text-color)`, which contradict the shipped defaults of HA. HA ships
   `#ffffff` and `#212121`. The aliases of `template.css` produce `#141414` and
   `#5e5e5e`. `--text-primary-color` means "text *on* the primary color", and it backs
   `--mdc-theme-on-primary`. The contrast rule reproduces both HA defaults exactly.

3. **`primary-background-color` derives to `#f3f3f3`.** The `NOTE:` of the knob limits
   the control to "Neutral Ramp 80, 90, 95 + white". `#fafafa` is on no neutral ramp.
   `neutral-95` is the nearest on-ramp value. `secondary-background-color` follows at
   `#e6e6e6`, one unit from the `#e5e5e5` of stock HA.

4. **The engine recomputes the `rgb-*` values from its own colors.** The `rgb-*`
   literals of `template.css` come from the legacy HA palette and do not match the
   other values of `template.css`. For example, it has `rgb-error-color: 219, 68, 55`
   (the legacy `#db4437`), while its `--error-color` is `#dc3146`. The engine derives
   each companion from the value that it accompanies. A test asserts that every
   companion agrees with its base.

### Ramp-bound primary variants

`--dark-primary-color`, `--darker-primary-color` and `--light-primary-color` bind to
ramp slots 30 / 20 / 50, as `template.css` specifies. They do not use the Lab
brighten and darken of HA. The Lab derivations run only in the *built-in* theme path of
HA, never for a YAML theme (§4.1 step 4). The values that HA ships for these three
variables are legacy Material constants. They are not derivations of `#009ac7`.

The bind to the ramp makes the whole family move together when the user changes the
primary seed. This behavior is the core idea of the product. The engine implements,
exports and tests the Lab functions for parity. `contrastingText` uses them.

---

## YAML output

- **Every value is quoted.** An unquoted `#` starts a YAML comment, so
  `primary-color: #009ac7` parses as an empty key (§5.5). The engine uses double quotes
  by default and single quotes for font stacks that contain double quotes.
- **The structure is `modes: { light, dark }`**, with mode-independent variables at the
  top level. The definition of both modes lets the user toggle the mode in their
  profile (§5.4).
- **Keys are bare**, without the `--` prefix.
- **The engine omits `rgb-*` companions wherever HA derives them itself.** That is
  wherever the base value starts with `#` (§4.1 step 5, the "hex only" rule of §5.5).
  All variables of the current set qualify, so the engine emits none. The rule is
  generic: a test proves that a non-hex base gets its companion.
- **The output is grouped and commented** like `template.css`. The user can read the two
  files side by side and understand what they paste.

Tests parse the output with a real YAML parser. They assert that the output round-trips
to the variable map of the engine.

---

## Preset provenance

`scripts/extract-presets.mjs` **generates** `presets/neutral-ramps.ts` and
`presets/palettes.ts`. Nobody types them by hand. The script parses the
`const rows = [...]` literal and the `<th data-col>` header row from the two reference
pages in `.references/colors/`, and writes the TS. Run it with:

```
node scripts/extract-presets.mjs
```

`presets.test.ts` parses the same pages independently and compares every cell with the
committed data. A manual edit or a faulty regeneration fails the test. The test also
asserts that the Home Assistant column of each table matches `template.css`.

The `black` and `white` rows of `black-white-ramps.html` feed `neutral-00` and
`neutral-100`. The `neutral-05`..`neutral-95` rows feed the rest of the ramp in the same
way. The extractor and the independent parse in `presets.test.ts` both include these
rows. The independent parse proves that the data is right, because it reads the
reference HTML itself. It trusts neither the extractor nor its own output.

The app never parses HTML at runtime.

---

## Dependencies

The engine has one dependency: [`culori`](https://culorijs.org) 4.0.2. It provides the
OKLCH conversion and the sRGB gamut mapping. It is well maintained, has no
dependencies, supports tree-shaking, and is the standard choice for CSS Color 4 work.
Own OKLab matrices and an own gamut-mapping binary search need more code and carry more
risk than `culori`, and they give no gain.

The HA-parity math does not use `culori` (see `ha-math.ts` above).

`clampChroma` decides gamut membership with a JND-based binary search. A color that sits
exactly on the sRGB boundary loses chroma, although sRGB represents it exactly:
`#0000ff` returns as `#0031e5`. `oklchToHex` therefore passes a color to chroma
reduction only when it is out of gamut by more than a rounding error. A test
round-trips 2000 deterministic random colors to check this.

---

## Tests

`src/engine/__tests__/` contains 150 tests in six files:

| File | Covers |
|---|---|
| `color.test.ts` | hex parsing and normalization, alpha helpers, OKLCH round-trips (including a 2000-color sweep), gamut mapping, clamping |
| `ha-math.test.ts` | Lab conversions against published CIE values, `Kn = 18` brighten/darken, WCAG luminance and contrast against known answers, the contrast threshold and where it flips |
| `ramps.test.ts` | seed survival at every slot, identity, monotonicity, hue/chroma transfer, and the edge cases: pure black, pure white, fully saturated seeds, achromatic seeds, seeds already at a ramp endpoint, an achromatic reference |
| `presets.test.ts` | preset data parsed from the reference pages and compared cell by cell, including the `neutral-00`/`neutral-100` rows. Font shortlist. HA columns against `template.css` |
| `derive.test.ts` | the `template.css` regression tests, knob → variable wiring, light/dark rules, contrast floors, elevation across all 16 background combinations, palette-reference resolution (follows the preset; a literal hex does not), `match-card`, the `surfaces()` anchor rule in both directions and the equal case, the widest gap of the current `SurfaceChoice` values, and the `neutralRampAt` clamp boundary |
| `yaml.test.ts` | quoting rules through a real YAML parser, structure, the rgb-omission rule, and file snapshots of three complete themes |

The snapshots are in `__tests__/__snapshots__/*.yaml`. They are readable as YAML, so a
diff in review shows the actual theme change.

Run `pnpm test` (`vitest run`) from the repo root.

If you run vitest directly instead of through the `pnpm test` script, and this checkout
has worktrees of other Claude Code sessions under `.claude/worktrees/`, exclude that
path. The `test.exclude` option in `vite.config.ts` does this for the `pnpm test`
script. The default excludes of vitest cover `.git` but not other dot-directories.
Without the exclusion, vitest discovers and runs the test files of the other sessions,
against the mid-edit state of their branches.
