# Home Assistant Frontend Theme System — Deep Reference

> Analyzed from source commit: `master` branch, July 2026  
> Source root: `https://github.com/home-assistant/frontend`

---

## Table of Contents

1. [File Inventory](#1-file-inventory)
2. [Variable Taxonomy](#2-variable-taxonomy)
3. [The Inheritance / Cascade Model](#3-the-inheritance--cascade-model)
4. [YAML → CSS Pipeline](#4-yaml--css-pipeline)
5. [Constraints and Gotchas](#5-constraints-and-gotchas)
6. [Blueprint for a Custom Theme](#6-blueprint-for-a-custom-theme)
7. [Theme Generator Architecture (Forward-Looking)](#7-theme-generator-architecture-forward-looking)

---

## 1. File Inventory

All files live under `src/resources/theme/` unless noted otherwise.

### Top-level files

| File | Role |
|------|------|
| `theme.ts` | Central barrel: assembles `themeStyles` (the full CSS string injected into the page) and exports `derivedStyles` (the merged object of all derived/alias variables used in theme processing) |
| `core.globals.ts` | Primitive structural tokens: border widths, border radii, spacing scale (`--ha-space-1` … `--ha-space-20`), animation durations |
| `main.globals.ts` | Layout/structural variables: header height, opacity scale constants, direction (LTR/RTL), safe-area insets, dialog backdrop filter |
| `typography.globals.ts` | Font system: families (`--ha-font-family-body/code/longform`), size scale (`--ha-font-size-xs` … `--ha-font-size-5xl`), weights, line heights, font smoothing |
| `semantic.globals.ts` | Non-color semantic tokens: box shadows (`--ha-box-shadow-s/m/l`) with a dark-mode override exported as `darkSemanticVariables` |
| `animations.globals.ts` | CSS `@keyframes` definitions (`fade-in`, `fade-out`, `scale`) — no custom properties, just animation rules |
| `wa.globals.ts` | WebAwesome component system tokens: bridges `--ha-*` primitives into `--wa-*` namespace for the WebAwesome UI library |

### `color/` subdirectory

| File | Role |
|------|------|
| `color/core.globals.ts` | Core (raw) color palette: `--ha-color-primary-{05..95}`, `--ha-color-neutral-{05..95}`, `--ha-color-orange-*`, `--ha-color-red-*`, `--ha-color-green-*`. These are raw hue ramps — not tied to UI purpose. |
| `color/semantic.globals.ts` | Semantic color layer: maps core tokens to intent-based names — text, border, fill, surface roles, and interaction states (resting/hover/active). Includes a full `darkSemanticColorStyles` block that inverts fill/border/surface for dark mode. |
| `color/color.globals.ts` | Legacy/compatibility color layer: the "public" HA theme variables consumers and theme authors use — `--primary-color`, `--card-background-color`, `--state-*-color`, `--energy-*-color`, MDC Material theme aliases, sidebar vars, label-badge vars, and the 54 named `--color-N` palette slots. Also defines `darkColorStyles` block. |
| `color/wa.globals.ts` | Maps semantic/color.globals values into `--wa-color-*` namespace for WebAwesome components (brand, neutral, success, warning, danger variants). |
| `color/index.ts` | Barrel: exports `darkColorVariables`, `colorDerivedVariables`, and `colorStylesCollection` (the ordered array of CSS strings). |

### Related files outside `src/resources/theme/`

| File | Role |
|------|------|
| `src/common/dom/apply_themes_on_element.ts` | **The core engine.** Takes a DOM element + theme data and writes CSS custom properties onto it. Handles dark mode merging, `primary-color` palette generation, and theme caching. |
| `src/common/style/derived-css-vars.ts` | Utility: `extractVars`, `extractDerivedVars`, `extractVar` — parses CSS strings to build variable maps used by `applyThemesOnElement`. |
| `src/state/themes-mixin.ts` | LitElement mixin applied to the root `<home-assistant>` element. Subscribes to theme changes from the backend, watches `prefers-color-scheme`, and calls `applyThemesOnElement` on `document.documentElement`. |
| `src/components/ha-card.ts` | Canonical Lovelace card component. Shows how `--ha-card-*` vars cascade with fallbacks to `--card-background-color`, `--ha-border-radius-lg`, `--divider-color`, etc. |
| `src/components/ha-sidebar.ts` | Sidebar component. Heavy consumer of `--sidebar-*`, `--ha-space-*`, `--ha-border-radius-*`, `--accent-color`. |

---

## 2. Variable Taxonomy

The system has four conceptual tiers. From innermost to outermost:

```
Tier 1: Core primitives (--ha-color-primary-40, --ha-space-4, --ha-border-radius-lg)
    ↓  aliased by
Tier 2: Semantic tokens (--ha-color-text-primary, --ha-color-fill-primary-loud-resting)
    ↓  aliased by
Tier 3: Legacy/public HA vars (--primary-color, --card-background-color, --state-light-active-color)
    ↓  consumed by
Tier 4: Component-scoped vars (--ha-card-background, --sidebar-background-color)
```

### 2.1 Core Color Palette (`color/core.globals.ts`)

Applied to `html`. These are **primitives** — never reference other vars.

| Variable | Default | Type |
|----------|---------|------|
| `--ha-color-primary-05` | `#001721` | Primitive |
| `--ha-color-primary-10` | `#002e3e` | Primitive |
| `--ha-color-primary-20` | `#004156` | Primitive |
| `--ha-color-primary-30` | `#006787` | Primitive |
| `--ha-color-primary-40` | `#009ac7` | Primitive |
| `--ha-color-primary-50` | `#18bcf2` | Primitive |
| `--ha-color-primary-60` | `#37c8fd` | Primitive |
| `--ha-color-primary-70` | `#7bd4fb` | Primitive |
| `--ha-color-primary-80` | `#b9e6fc` | Primitive |
| `--ha-color-primary-90` | `#dff3fc` | Primitive |
| `--ha-color-primary-95` | `#eff9fe` | Primitive |
| `--ha-color-neutral-05..95` | Grayscale ramp | Primitive |
| `--ha-color-orange-05..95` | Orange ramp | Primitive |
| `--ha-color-red-05..95` | Red ramp | Primitive |
| `--ha-color-green-05..95` | Green ramp | Primitive |
| `--ha-color-black` | `#000000` | Primitive |
| `--ha-color-white` | `#ffffff` | Primitive |

**YAML override:** Yes. Writing `ha-color-primary-40: "#ff0000"` in a YAML theme sets `--ha-color-primary-40: #ff0000` as an inline style on `document.documentElement`. Because `processTheme()` also writes all `derivedStyles` vars — which include `primary-color: var(--ha-color-primary-40)`, `ha-color-text-link: var(--ha-color-primary-40)`, `ha-color-fill-primary-loud-resting: var(--ha-color-primary-40)`, and all other semantic aliases referencing this slot — the full downstream chain resolves to the new value.

The "default" built-in theme and custom YAML themes are mutually exclusive code paths. `generateColorPalette()` runs only in the "default" path; YAML keys from `themes.themes` are never read there. No conflict is possible.

### 2.2 Semantic Color Tokens (`color/semantic.globals.ts`)

Semantic aliases of core tokens mapping intent to color slot.

#### Text

| Variable | Light Default | YAML? |
|----------|---------------|-------|
| `--ha-color-text-primary` | `var(--ha-color-neutral-05)` | No |
| `--ha-color-text-secondary` | `var(--ha-color-neutral-40)` | No |
| `--ha-color-text-disabled` | `var(--ha-color-neutral-60)` | No |
| `--ha-color-text-link` | `var(--ha-color-primary-40)` | No |
| `--ha-color-text-primary-inverted` | `var(--ha-color-white)` | No |

Dark mode overrides: `--ha-color-text-primary` → `white`, `--ha-color-text-secondary` → `--ha-color-neutral-80`.

#### Surfaces

| Variable | Light Default | YAML? |
|----------|---------------|-------|
| `--ha-color-surface-default` | `var(--ha-color-white)` | No |
| `--ha-color-surface-low` | `var(--ha-color-neutral-95)` | No |
| `--ha-color-surface-lower` | `var(--ha-color-neutral-90)` | No |
| `--ha-color-on-surface-default` | `var(--ha-color-neutral-05)` | No |

Dark overrides: `--ha-color-surface-default` → `var(--ha-color-neutral-10)`, etc.

#### Fill Tokens (primary/neutral/danger/warning/success × quiet/normal/loud × resting/hover/active)

These form a 45-variable matrix per category (5 intents × 3 levels × 3 states), e.g.:
- `--ha-color-fill-primary-loud-resting` → `var(--ha-color-primary-40)` (light)
- `--ha-color-fill-primary-loud-resting` → `var(--ha-color-primary-10)` (dark)

Same pattern for border tokens: `--ha-color-border-{intent}-{quiet|normal|loud}`.

**YAML override:** Yes, via the same mechanism as Section 2.1. The "No" in the YAML column above denotes "not officially supported", not "engine-rejected". See Section 5.2.

### 2.3 Public/Legacy HA Variables (`color/color.globals.ts`)

The officially supported YAML target namespace. Historically stable names; most are semantic aliases of tier-2 vars.

#### Primary Palette

| Variable | Default (light) | Type | YAML? |
|----------|-----------------|------|-------|
| `--primary-color` | `var(--ha-color-primary-40)` = `#009ac7` | Semantic alias | **Yes** |
| `--dark-primary-color` | `#0288d1` | Primitive | Yes (derived from primary) |
| `--darker-primary-color` | `#016194` | Primitive | Yes |
| `--light-primary-color` | `#b3e5fc` | Primitive | Yes |
| `--accent-color` | `#ff9800` | Primitive | **Yes** |
| `--rgb-primary-color` | `0, 154, 199` | Derived | Auto-generated |
| `--rgb-accent-color` | `255, 152, 0` | Derived | Auto-generated |

#### Text Colors

| Variable | Default | Type | YAML? |
|----------|---------|------|-------|
| `--primary-text-color` | `var(--ha-color-text-primary)` | Semantic alias | Yes |
| `--secondary-text-color` | `var(--ha-color-text-secondary)` | Semantic alias | Yes |
| `--text-primary-color` | `#ffffff` | Primitive (on-primary) | Yes |
| `--text-light-primary-color` | `#212121` | Primitive | Yes |
| `--disabled-text-color` | `#bdbdbd` | Primitive | Yes |

#### Backgrounds

| Variable | Light Default | Dark Default | YAML? |
|----------|---------------|--------------|-------|
| `--primary-background-color` | `#fafafa` | `#111111` | **Yes** |
| `--card-background-color` | `#ffffff` | `#1c1c1c` | **Yes** |
| `--secondary-background-color` | `#e5e5e5` | `#282828` | Yes |
| `--clear-background-color` | `#ffffff` | `#111111` | Yes |

#### Dividers and Shadows

| Variable | Default | YAML? |
|----------|---------|-------|
| `--divider-color` | `rgba(0, 0, 0, 0.12)` | Yes |
| `--outline-color` | `rgba(0, 0, 0, 0.12)` | Yes |
| `--shadow-color` | `rgba(0, 0, 0, 0.16)` | Yes |
| `--scrollbar-thumb-color` | `rgb(194, 194, 194)` | Yes |

#### Status / Feedback Colors

| Variable | Default | YAML? |
|----------|---------|-------|
| `--error-color` | `#db4437` | Yes |
| `--warning-color` | `#ffa600` | Yes |
| `--success-color` | `#43a047` | Yes |
| `--info-color` | `#039be5` | Yes |
| `--disabled-color` | `#bdbdbd` | Yes |

#### Named Color Palette (for state mapping)

A full Material Design-style color palette, each a primitive hex:

`--red-color`, `--pink-color`, `--purple-color`, `--deep-purple-color`, `--indigo-color`, `--blue-color`, `--light-blue-color`, `--cyan-color`, `--teal-color`, `--green-color`, `--light-green-color`, `--lime-color`, `--yellow-color`, `--amber-color`, `--orange-color`, `--deep-orange-color`, `--brown-color`, `--light-grey-color`, `--grey-color`, `--dark-grey-color`, `--blue-grey-color`, `--black-color`, `--white-color`

All YAML-overridable. These feed the state-domain color system.

#### State Colors

Pattern: `--state-{domain}-{device_class?}-{state}-color` (or simpler variants). Examples:

| Variable | Default |
|----------|---------|
| `--state-active-color` | `var(--amber-color)` |
| `--state-inactive-color` | `var(--grey-color)` |
| `--state-unavailable-color` | `var(--disabled-text-color)` |
| `--state-light-active-color` | `var(--amber-color)` |
| `--state-climate-heat-color` | `var(--deep-orange-color)` |
| `--state-alarm_control_panel-triggered-color` | `var(--red-color)` |
| `--state-cover-active-color` | `var(--purple-color)` |
| `--state-media_player-inactive-color` | `var(--grey-color)` |

**All of these are YAML-overridable.** The frontend looks them up at render time by composing the variable name from entity domain/device_class/state.

#### Energy Colors

| Variable | Default |
|----------|---------|
| `--energy-grid-consumption-color` | `#488fc2` |
| `--energy-grid-return-color` | `#8353d1` |
| `--energy-solar-color` | `#ff9800` |
| `--energy-non-fossil-color` | `#0f9d58` |
| `--energy-battery-out-color` | `#4db6ac` |
| `--energy-battery-in-color` | `#f06292` |
| `--energy-gas-color` | `#8e021b` |
| `--energy-water-color` | `#00bcd4` |

All YAML-overridable.

#### Graph/Calendar Colors

54 slots (`--color-1` through `--color-54`) used for charts, calendars, maps. All YAML-overridable but rarely needed.

#### Sidebar Variables (Semantic Aliases)

| Variable | Default | YAML? |
|----------|---------|-------|
| `--sidebar-text-color` | `var(--primary-text-color)` | Yes |
| `--sidebar-background-color` | `var(--card-background-color)` | Yes |
| `--sidebar-selected-text-color` | `var(--primary-color)` | Yes |
| `--sidebar-selected-icon-color` | `var(--primary-color)` | Yes |
| `--sidebar-icon-color` | `rgba(var(--rgb-primary-text-color), 0.6)` | Yes |

Additional sidebar vars consumed by the component but not defined in theme files (set to component defaults): `--sidebar-menu-button-text-color`, `--sidebar-menu-button-background-color`, `--ha-sidebar-expanded-width` (256px), `--ha-sidebar-expanded-item-width` (248px).

#### MDC (Material Design Components) Aliases

These allow Material Web components to pick up HA theme colors. All are semantic aliases:

| Variable | Maps To |
|----------|---------|
| `--mdc-theme-primary` | `var(--primary-color)` |
| `--mdc-theme-secondary` | `var(--accent-color)` |
| `--mdc-theme-background` | `var(--primary-background-color)` |
| `--mdc-theme-surface` | `var(--card-background-color)` |
| `--mdc-theme-on-primary` | `var(--text-primary-color)` |
| `--mdc-theme-error` | `var(--error-color)` |

MDC text-field, select, checkbox, radio, tab, button, and dialog vars all point back to `--input-*` aliases which in turn point to primitive rgba values.

#### Input Component Variables

A set of `--input-*` and `--mdc-text-field-*` / `--mdc-select-*` vars that control form field appearance. In dark mode these flip from dark-on-light to light-on-dark rgba values.

### 2.4 Structural / Spacing / Typography Tokens (`core.globals.ts`, `main.globals.ts`, `typography.globals.ts`)

Not part of the officially supported YAML namespace. Accepted by the engine (see Section 5.2) — the `[key: string]: string` interface imposes no restrictions. Subject to change between HA releases without notice.

#### Spacing Scale

| Variable | Value |
|----------|-------|
| `--ha-space-1` | `4px` |
| `--ha-space-2` | `8px` |
| `--ha-space-3` | `12px` |
| `--ha-space-4` | `16px` |
| `--ha-space-5..20` | `20px..80px` (4px increments) |

#### Border Radius Scale

| Variable | Value |
|----------|-------|
| `--ha-border-radius-sm` | `4px` |
| `--ha-border-radius-md` | `8px` |
| `--ha-border-radius-lg` | `12px` (default card radius) |
| `--ha-border-radius-xl` | `16px` |
| `--ha-border-radius-2xl` | `20px` |
| `--ha-border-radius-3xl` | `24px` |
| `--ha-border-radius-4xl..6xl` | `28..36px` |
| `--ha-border-radius-pill` | `9999px` |

#### Typography Scale

| Variable | Value |
|----------|-------|
| `--ha-font-size-xs` | `calc(10px * var(--ha-font-size-scale))` |
| `--ha-font-size-s` | `calc(12px * …)` |
| `--ha-font-size-m` | `calc(14px * …)` — body default |
| `--ha-font-size-l` | `calc(16px * …)` |
| `--ha-font-size-xl` | `calc(20px * …)` |
| `--ha-font-size-2xl` | `calc(24px * …)` |
| `--ha-font-size-3xl..5xl` | `28..40px` |
| `--ha-font-size-scale` | `1` — global multiplier |
| `--ha-font-family-body` | `Roboto, Noto, sans-serif` |
| `--ha-font-family-code` | `monospace` |
| `--ha-font-family-heading` | Alias → `--ha-font-family-body` |
| `--ha-font-weight-light/normal/medium/bold` | `300/400/500/700` |
| `--ha-line-height-condensed/normal/expanded` | `1.2/1.6/2` |

#### Animation Durations

| Variable | Value |
|----------|-------|
| `--ha-animation-duration-none` | `1ms` |
| `--ha-animation-duration-instant` | `75ms` |
| `--ha-animation-duration-fast` | `150ms` |
| `--ha-animation-duration-normal` | `250ms` |
| `--ha-animation-duration-slow` | `350ms` |

(All collapse to `1ms` when `prefers-reduced-motion: reduce` is active.)

### 2.5 Component-Scoped Override Variables

These variables are declared with default values inside specific component Shadow DOM scopes and can be overridden globally or per-element. Examples:

#### `ha-card` component

| Variable | Default | Notes |
|----------|---------|-------|
| `--ha-card-background` | `var(--card-background-color, white)` | Card fill |
| `--ha-card-border-radius` | `var(--ha-border-radius-lg)` = 12px | Card corner radius |
| `--ha-card-border-width` | `1px` | Border thickness |
| `--ha-card-border-color` | `var(--divider-color, #e0e0e0)` | Border color |
| `--ha-card-box-shadow` | `none` | Shadow |
| `--ha-card-backdrop-filter` | `none` | Blur/glass effect |
| `--ha-card-header-color` | `var(--primary-text-color)` | Header text |
| `--ha-card-header-font-size` | `var(--ha-font-size-2xl)` | Header font size |

#### `ha-sidebar` component

| Variable | Default | Notes |
|----------|---------|-------|
| `--sidebar-menu-button-text-color` | `var(--primary-text-color)` | Hamburger menu text |
| `--sidebar-menu-button-background-color` | `inherit` | Hamburger bg |
| `--ha-sidebar-expanded-width` | `256px` | Sidebar open width |
| `--ha-sidebar-expanded-item-width` | `248px` | Nav item width when expanded |

#### App header

| Variable | Default | Notes |
|----------|---------|-------|
| `--app-header-background-color` | `var(--sidebar-background-color)` | Top bar fill |
| `--app-header-text-color` | `var(--sidebar-text-color)` | Top bar text |
| `--app-header-border-bottom` | `1px solid var(--divider-color)` | Bottom border |
| `--app-theme-color` | `var(--app-header-background-color)` | Browser meta theme-color |
| `--app-header-edit-background-color` | `#455a64` (hardcoded fallback) | Edit mode header |
| `--app-header-edit-text-color` | `white` (hardcoded fallback) | Edit mode text |

### 2.6 Box Shadows (`semantic.globals.ts`)

| Variable | Light | Dark |
|----------|-------|------|
| `--ha-box-shadow-s` | `0 1px 2px rgba(0,0,0,0.08), …` | `0 1px 2px rgba(0,0,0,0.4), …` |
| `--ha-box-shadow-m` | `0 3px 6px rgba(0,0,0,0.1), …` | `0 3px 6px rgba(0,0,0,0.35), …` |
| `--ha-box-shadow-l` | `0 6px 12px rgba(0,0,0,0.12), …` | `0 6px 12px rgba(0,0,0,0.4), …` |
| `--bar-box-shadow` | `0 2px 12px var(--shadow-color)` | Same (inherited) |

---

## 3. The Inheritance / Cascade Model

### 3.1 Loading Order (What Gets Applied to `html` at Boot)

`theme.ts` assembles a single CSS string in this order:

```
1. coreStyles           → spacing, border-radius, animation durations
2. mainStyles           → layout vars, safe-area insets, opacity constants
3. typographyStyles     → font family, size/weight/line-height scale
4. semanticStyles       → box shadows (non-color)
5. coreColorStyles      → raw color palette (--ha-color-*)
6. semanticColorStyles  → intent-mapped color aliases (--ha-color-text-*, fill-*, etc.)
7. colorStyles          → legacy HA vars (--primary-color, --card-background-color, etc.)
8. waColorStyles        → --wa-color-* bridge
9. fontStyles           → @font-face for Roboto
10. waMainStyles        → --wa-* structural tokens
11. animationStyles     → @keyframes
```

Inserted as a `<style>` tag in `<head>` during app bootstrap. All rules target the `html` element selector.

### 3.2 Dark Mode Layer

When dark mode is active, two additional variable maps are applied before any custom theme:

1. `darkColorVariables` — from `darkColorStyles` (`color.globals.ts`) + `darkSemanticColorStyles` (`color/semantic.globals.ts`). Overrides backgrounds, text, input colors, semantic fill/border tokens.
2. `darkSemanticVariables` — from `darkSemanticStyles` (`semantic.globals.ts`). Overrides box shadows.

Applied via `element.style.setProperty()` on `document.documentElement`. Inline style specificity exceeds the `<style>` tag, so these win without selectors.

### 3.3 User YAML Theme Layer

User theme rules are applied after dark-mode vars, also via `element.style.setProperty()` on `document.documentElement`. All writes share the same inline style map; later writes win. User YAML always overwrites dark-mode overrides.

Merge order:

```
[html <style> tag] base light styles (specificity: html selector)
    ↓  overridden by inline style on document.documentElement:
[document.documentElement inline style] dark mode vars (if dark mode on)
    ↓  overridden by (same inline style map, later keys):
[document.documentElement inline style] user theme vars
    ↓  overridden by (same inline style map, later keys):
[document.documentElement inline style] user theme mode-specific vars (dark/light)
```

### 3.4 DOM Attachment Points

| Layer | Applied To | Mechanism |
|-------|-----------|-----------|
| Base styles (all globals) | `<html>` | `<style>` tag in `<head>` |
| Dark mode overrides | `document.documentElement` | `element.style.setProperty()` |
| User theme | `document.documentElement` | `element.style.setProperty()` |
| Per-view theme | `hui-view-container` element | `applyThemesOnElement()` called on that element |
| Per-card theme | individual card element | `applyThemesOnElement()` called on the card |

CSS custom properties inherit through Shadow DOM boundaries. Variables set on `<html>` or `document.documentElement` cascade into all web component shadow roots unless a component locally re-declares a variable.

### 3.5 Variable Resolution Chain Example

Tracing `--sidebar-background-color` from raw token to rendered pixel:

```
html { --ha-color-neutral-95: #f3f3f3 }   [core.globals.ts]
html { --ha-color-surface-default: var(--ha-color-white) }   [semantic.globals.ts — light]
html { --card-background-color: #ffffff }   [color.globals.ts]
html { --sidebar-background-color: var(--card-background-color) }   [color.globals.ts]

→ ha-sidebar :host { background-color: var(--sidebar-background-color) }
→ renders as: #ffffff (light) or #1c1c1c (dark, via darkColorStyles override)
```

Setting `card-background-color: "#f0f0f0"` propagates to `--sidebar-background-color` automatically via the alias chain.

---

## 4. YAML → CSS Pipeline

### 4.1 Step-by-Step

**Step 1 — User writes YAML:**
```yaml
frontend:
  themes:
    my_theme:
      primary-color: "#0077cc"
      accent-color: "#ff5500"
      card-background-color: "#f8f8f8"
```

Key naming rule: omit the `--` prefix. YAML keys are bare names.

**Step 2 — HA backend stores and serves theme data:**

When HA starts, it reads `configuration.yaml`, parses themes, and stores them server-side. The WebSocket event `frontend_themes_updated` delivers a payload to the frontend in the shape:

```typescript
type ThemeVars = Record<string, string>;
type Theme = ThemeVars & { modes?: { light?: ThemeVars; dark?: ThemeVars } };
type Themes = {
  default_theme: string;
  default_dark_theme: string | null;
  themes: Record<string, Theme>;
  darkMode: boolean;
  theme: string;  // currently active theme name
};
```

**Step 3 — `themes-mixin.ts` receives the data:**

`subscribeThemes()` fires on connection, calls `_applyTheme(darkPreferred)` which:
- Determines effective theme name (falls back to `default_theme` or `default_dark_theme`)
- Determines dark mode (from system preference or user override)
- Handles `modes` key: if theme only has `dark`, forces dark mode; if only `light`, forces light; if both, follows user/system preference
- Calls `applyThemesOnElement(document.documentElement, themes, themeName, themeSettings, true)`

**Step 4 — `applyThemesOnElement()` merges variables:**

```
themeRules = {}

if (darkMode):
    themeRules = { ...darkSemanticVariables, ...darkColorVariables }
    // This includes bg, text, input, box-shadow dark overrides

if (theme === "default"):
    // Special handling: derives palette from primaryColor/accentColor user settings
    themeRules["primary-color"] = primaryColor
    themeRules["light-primary-color"] = labBrighten(primaryColor)
    themeRules["dark-primary-color"] = labDarken(primaryColor)
    themeRules["text-primary-color"] = contrastCheck(primaryColor)  // white or #212121
    themeRules["state-icon-color"] = themeRules["dark-primary-color"]
    // Also calls generateColorPalette() to fill --ha-color-primary-* slots
    themeRules["accent-color"] = accentColor
    themeRules["text-accent-color"] = contrastCheck(accentColor)

else (custom theme):
    const { modes, ...baseRules } = themes.themes[themeName]
    themeRules = { ...themeRules, ...baseRules }
    if (modes?.dark && darkMode): themeRules = { ...themeRules, ...modes.dark }
    if (modes?.light && !darkMode): themeRules = { ...themeRules, ...modes.light }
```

**Step 5 — `processTheme()` prefixes and auto-derives RGB values:**

```typescript
const combinedTheme = { ...derivedStyles, ...themeRules };
// derivedStyles = all vars from theme files that themselves reference var()
// themeRules user vars win because they come after

for (const key of Object.keys(combinedTheme)) {
    styles[`--${key}`] = String(combinedTheme[key]);
    
    // Auto-generate rgb-* companion for hex values
    if (value.startsWith("#") && !combinedTheme[`rgb-${key}`]) {
        styles[`--rgb-${key}`] = hex2rgb(value).join(",");
    }
}
```

**Step 6 — Variables are written to `document.documentElement`:**

```typescript
element.style.setProperty(`--primary-color`, "#0077cc");
element.style.setProperty(`--rgb-primary-color`, "0,119,204");  // auto-derived
element.style.setProperty(`--accent-color`, "#ff5500");
element.style.setProperty(`--rgb-accent-color`, "255,85,0");    // auto-derived
element.style.setProperty(`--card-background-color`, "#f8f8f8");
element.style.setProperty(`--rgb-card-background-color`, "248,248,248");  // auto-derived
// ... all merged vars ...
```

**Step 7 — Browser CSS cascade resolves:**

Every component that reads `var(--primary-color)` now receives the user's value. Components using RGB vars like `rgba(var(--rgb-primary-color), 0.15)` also get the auto-generated companion automatically.

### 4.2 Key Transformation Rules

| Input (YAML) | Output (CSS) | Notes |
|-------------|--------------|-------|
| `primary-color: "#0077cc"` | `--primary-color: #0077cc` | Direct mapping |
| `primary-color: "#0077cc"` | `--rgb-primary-color: 0,119,204` | Auto-generated companion |
| `accent-color: orange` | `--accent-color: orange` | Named CSS colors work |
| `card-background-color: "rgba(0,0,0,0.5)"` | `--card-background-color: rgba(0,0,0,0.5)` | Non-hex: no rgb companion |
| `modes: { dark: { … } }` | Applied only when dark mode active | Mode-specific keys |

### 4.3 Theme Caching

`processTheme()` stores results in `PROCESSED_THEMES[cacheKey]`. The cache key is computed as:
```
"{themeName}" + ("__dark" if dark) + ("__primary_{hex}" if primaryColor) + ("__accent_{hex}" if accentColor)
```

The cache is invalidated (`PROCESSED_THEMES = {}`) every time the backend pushes new theme data.

---

## 5. Constraints and Gotchas

### 5.1 Officially Supported vs. Unsupported Variables

The HA docs explicitly declare only two categories as **supported**:

1. `primary-color` and `accent-color`
2. `state-{domain}-{device_class?}-{state}-color` pattern

All other variables are explicitly unsupported and may change between releases. Variables in `color.globals.ts` (backgrounds, text, sidebar, energy) are de facto stable but carry no guarantee.

### 5.2 YAML Override Scope

Any CSS custom property can be set from YAML. `ThemeVars` (`src/data/ws-themes.ts`) uses `[key: string]: string` — no whitelist. `processTheme()` iterates all keys and calls `element.style.setProperty(`--${key}`, value)` on `document.documentElement`. Inline style wins over `<style>` tag rules unconditionally.

Examples of non-obvious but valid YAML keys:
- `ha-color-primary-40: "#ff0000"` — core ramp token; cascades to all semantic aliases (see Section 2.1)
- `ha-space-4: "20px"` — spacing token
- `ha-border-radius-lg: "12px"` — border radius
- `ha-font-size-lg: "18px"` — font size

**Cascade behavior by token type:**

*Derived tokens* (in `derivedStyles` — value contains `var()` in source): `processTheme()` writes both the alias and the user override to the same inline style map. Browser resolves the chain in one pass. Example: setting `ha-color-primary-40` automatically updates `--primary-color`, `--ha-color-text-link`, `--ha-color-fill-primary-loud-resting`, and all other aliases referencing that slot.

*Primitive tokens* (not in `derivedStyles` — raw value, no `var()`): user override is written as inline style; wins over `<style>` tag. No upstream cascade — single-token override only.

Custom CSS via `extra_module_url` or `card-mod` is required only for properties that are not CSS custom properties (e.g. `border` shorthand, element-level `font-family`, structural layout).

### 5.3 Variables That Must Be Set Together

Setting `primary-color` alone leaves derived variants at their defaults. For full consistency across states, contrast, and icon colors, set the full family:

```yaml
primary-color: "#0077cc"
dark-primary-color: "#005fa3"          # hover/active states
darker-primary-color: "#004d8a"        # pressed states
light-primary-color: "#b3d7f5"         # light tints (slider secondary color)
text-primary-color: "#ffffff"          # text ON the primary color (for buttons)
text-light-primary-color: "#212121"    # text on light tints
state-icon-color: "#005fa3"            # entity icon default color
rgb-primary-color: "0, 119, 204"       # for rgba() usages (auto-generated for hex values)
```

In the built-in "default" theme, `dark-primary-color`, `text-primary-color`, and `state-icon-color` are auto-derived via Lab-space color math from the profile page color picker. In custom YAML themes, these must be set explicitly.

Similarly for `accent-color`:
```yaml
accent-color: "#ff5500"
text-accent-color: "#ffffff"           # text ON accent (not auto-derived in YAML themes)
```

### 5.4 Dark Mode Handling

HA does not auto-generate a dark variant. Three structures are supported:

**Legacy (always light base):**
```yaml
my_theme:
  primary-color: pink   # inherits light mode HA defaults
```

**Dark-only theme:**
```yaml
my_theme:
  primary-color: pink   # mode-independent
  modes:
    dark:
      secondary-text-color: slategray
```
When only `dark` mode is defined, it is automatically selected. Base is the HA default dark theme.

**Dual light+dark theme:**
```yaml
my_theme:
  primary-color: coral
  modes:
    light:
      secondary-text-color: olive
    dark:
      secondary-text-color: slategray
```
User can toggle modes in profile settings.

When `modes` is present: `applyThemesOnElement()` applies `darkColorVariables` + `darkSemanticVariables` first, then mode-independent vars, then mode-specific vars. Without `modes`, no dark overrides are applied regardless of OS `prefers-color-scheme`.

### 5.5 Known Pitfalls

**Hardcoded fallbacks.** Some components use hardcoded hex values as `var()` fallbacks. The theme variable only takes effect if the name matches the first `var()` argument exactly:
```css
/* ha-card.ts */
background: var(--ha-card-background, var(--card-background-color, white));
border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
```
Set `card-background-color` (YAML key, no `--`), not `ha-card-background`.

**App header edit mode has hardcoded fallbacks:**
```css
background-color: var(--app-header-edit-background-color, #455a64);
color: var(--app-header-edit-text-color, white);
```
These can be overridden via YAML with keys `app-header-edit-background-color` and `app-header-edit-text-color`.

**RGB auto-generation: hex only.** `processTheme()` generates `--rgb-{key}` companions only when the value starts with `#`. Writing `primary-color: "rgb(0, 119, 204)"` skips companion generation; components using `rgba(var(--rgb-primary-color), 0.15)` will receive an unset variable. Use hex for all colors requiring RGB companions.

**Hex values in YAML need quotes.** `primary-color: #0077cc` is invalid YAML (the `#` starts a comment). Write `primary-color: "#0077cc"`.

**`card-mod` specificity.** `card-mod` per-card CSS overrides may have higher specificity than inherited theme variables from `document.documentElement`.

**Third-party custom cards.** HACS cards frequently use hardcoded colors or custom property names outside HA's theme namespace. Theme variable coverage applies only to official HA UI elements.

**Lovelace view-level themes.** Views may specify a `theme` key; this calls `applyThemesOnElement()` on the view container element, creating an inline style map scoped to that element that cascades to all cards within it.

**`primary-color` vs `ha-color-primary-40` divergence.** Setting `primary-color: "#0077cc"` in YAML writes a literal hex to `--primary-color` as inline style, replacing the default `var(--ha-color-primary-40)` reference. `--ha-color-primary-40` itself remains at its `<style>` tag value (`#009ac7`). Components reading `--ha-color-primary-40` directly (newer components using Tier 1 tokens) receive the old value.

To update both simultaneously, set the core token instead: `ha-color-primary-40: "#0077cc"`. `processTheme()` writes `--ha-color-primary-40: #0077cc` from the user YAML and `--primary-color: var(--ha-color-primary-40)` from `derivedStyles` — both land on the same inline style map, so the browser resolves the chain correctly. As HA migrates more components from `--primary-color` to `--ha-color-primary-40`, overriding the core token becomes increasingly important for full coverage.

---

## 6. Blueprint for a Custom Theme

Minimal complete YAML theme targeting the full officially supported variable set. Replace values as needed.

```yaml
frontend:
  themes:
    my_custom_theme:
      # ===================================================
      # PRIMARY COLOR FAMILY
      # The main brand/action color. All interactive UI uses this.
      # ===================================================
      primary-color: "#0077cc"
      dark-primary-color: "#005fa3"          # hover/press variant
      darker-primary-color: "#004d8a"        # deep press
      light-primary-color: "#b3d7f5"         # tints (slider track, etc.)
      text-primary-color: "#ffffff"          # text rendered ON primary buttons
      text-light-primary-color: "#212121"    # text rendered on light primary tints
      state-icon-color: "#005fa3"            # default entity icon color

      # ===================================================
      # ACCENT COLOR
      # Secondary action color: badges, FABs, highlights.
      # ===================================================
      accent-color: "#ff6600"
      text-accent-color: "#ffffff"           # text ON accent elements

      # ===================================================
      # BACKGROUNDS
      # The core surface hierarchy.
      # ===================================================
      primary-background-color: "#f0f4f8"    # page/app background
      secondary-background-color: "#dde3ea"  # secondary panels, table alternates
      card-background-color: "#ffffff"       # card/panel surface
      clear-background-color: "#ffffff"      # dialogs, transparent-needing surfaces

      # ===================================================
      # TEXT
      # ===================================================
      primary-text-color: "#1a2332"          # body text
      secondary-text-color: "#5a6a7a"        # muted/supporting text
      disabled-text-color: "#aab4be"         # disabled state text

      # ===================================================
      # DIVIDERS / OUTLINES
      # ===================================================
      divider-color: "rgba(0, 0, 0, 0.10)"
      outline-color: "rgba(0, 0, 0, 0.10)"
      shadow-color: "rgba(0, 0, 0, 0.12)"
      scrollbar-thumb-color: "rgb(180, 190, 200)"

      # ===================================================
      # STATUS COLORS
      # Error, warning, success, info feedback.
      # ===================================================
      error-color: "#d32f2f"
      warning-color: "#f57c00"
      success-color: "#388e3c"
      info-color: "#0288d1"

      # ===================================================
      # SIDEBAR
      # Sidebar background and icon/text colors.
      # ===================================================
      sidebar-background-color: "#ffffff"
      sidebar-text-color: "#1a2332"
      sidebar-icon-color: "rgba(26, 35, 50, 0.55)"
      sidebar-selected-text-color: "#0077cc"
      sidebar-selected-icon-color: "#0077cc"

      # ===================================================
      # APP HEADER
      # Top bar. Defaults to sidebar colors if not set.
      # ===================================================
      app-header-background-color: "#ffffff"
      app-header-text-color: "#1a2332"

      # ===================================================
      # DARK MODE VARIANT
      # Define both modes to allow user to toggle.
      # ===================================================
      modes:
        light:
          # (nothing extra — light values set above are already light-mode)
          card-background-color: "#ffffff"
          primary-background-color: "#f0f4f8"

        dark:
          # Dark mode overrides — backgrounds flip to dark
          primary-background-color: "#111820"
          secondary-background-color: "#1e2835"
          card-background-color: "#1a2535"
          clear-background-color: "#111820"

          # Text flips to light
          primary-text-color: "#e0e8f0"
          secondary-text-color: "#8fa3b8"
          disabled-text-color: "#4a5a6a"

          # Dividers lighten on dark
          divider-color: "rgba(224, 232, 240, 0.12)"
          shadow-color: "rgba(0, 0, 0, 0.48)"
          scrollbar-thumb-color: "rgb(70, 90, 110)"

          # Sidebar dark
          sidebar-background-color: "#1a2535"
          sidebar-text-color: "#e0e8f0"
          sidebar-icon-color: "rgba(224, 232, 240, 0.6)"
          app-header-background-color: "#1a2535"
          app-header-text-color: "#e0e8f0"

          # Input dark
          input-fill-color: "rgba(255, 255, 255, 0.05)"
          input-ink-color: "rgba(255, 255, 255, 0.87)"
          input-label-ink-color: "rgba(255, 255, 255, 0.6)"
          input-idle-line-color: "rgba(255, 255, 255, 0.42)"
          input-hover-line-color: "rgba(255, 255, 255, 0.87)"
```

**Notes:**
- `modes.light` is optional; top-level vars already serve as the light base.
- Values requiring alpha transparency: use `rgba()` — these produce no RGB companion and do not need one.
- `input-*` dark overrides replicate HA defaults; include only when customizing input field colors.
- `--ha-space-*` and `--ha-border-radius-*` are not part of the officially supported namespace but are accepted by the engine (see Section 5.2).

---

## 7. Theme Generator Architecture (Forward-Looking)

### 7.1 Conceptual Model

A generator accepts a small set of **seed inputs** (8–12 values) and derives all downstream YAML variables algorithmically. The HA source defines explicit dependency relationships between variable tiers that map directly to derivation logic.

### 7.2 User Inputs (Seed Variables)

The minimum viable set of controls:

| Input | Type | Description |
|-------|------|-------------|
| `primaryHue` | Color picker | The single most important brand color |
| `accentHue` | Color picker | Secondary/highlight color |
| `surfaceHue` | Color picker or `neutral` | Background/card surface color |
| `textHue` | Color picker or `auto` | Body text (usually auto-derived from surface) |
| `darkMode` | Toggle | Whether to generate dark variant |
| `cardRadius` | Slider (0–24px) | Card corner radius (maps to `--ha-card-border-radius`) |
| `sidebarStyle` | Select: `transparent` / `colored` / `dark` | Sidebar appearance variant |
| `borderStyle` | Select: `none` / `subtle` / `visible` | Card border visibility |
| `statusColors` | Expand/collapse group | Override error/warning/success/info if needed |
| `energyColors` | Expand/collapse group | Override energy dashboard colors |

### 7.3 Derived Variable Computation

The generator computes all YAML values from the seeds using these relationships:

```
primary-color = primaryHue (e.g. "#0077cc")

// Lab-space derivations (matches HA's own algorithm in apply_themes_on_element.ts)
rgb = hex2rgb(primaryHue)
lab = rgb2lab(rgb)

dark-primary-color   = lab2hex(labDarken(lab, 1))
darker-primary-color = lab2hex(labDarken(lab, 2))
light-primary-color  = rgb2hex(lab2rgb(labBrighten(lab)))

// Contrast check (WCAG 4.5:1 against #212121)
text-primary-color = rgbContrast(rgb, [33,33,33]) < 6 ? "#fff" : "#212121"
text-light-primary-color = contrastCheck(lightPrimaryRgb)

// Accent
accent-color = accentHue
text-accent-color = contrastCheck(hex2rgb(accentHue))

// Surfaces (light mode)
primary-background-color  = lightness-shift(surfaceHue, +4%)  // very light
secondary-background-color = lightness-shift(surfaceHue, -5%) // slightly darker
card-background-color      = "#ffffff" (or surfaceHue if colored surface chosen)
divider-color = `rgba(0,0,0, 0.10)`  // fixed alpha on dark text

// Text (light mode)
primary-text-color   = "#212121" (unless surfaceHue is dark, then lighten)
secondary-text-color = lightness-shift(primaryText, +30%)
disabled-text-color  = lightness-shift(primaryText, +50%)

// Sidebar
if sidebarStyle == "transparent":
    sidebar-background-color = card-background-color
    sidebar-text-color = primary-text-color
    sidebar-selected-icon-color = primary-color
else if sidebarStyle == "colored":
    sidebar-background-color = primaryHue
    sidebar-text-color = text-primary-color  // auto-contrast
    sidebar-selected-icon-color = "#fff"
else if sidebarStyle == "dark":
    sidebar-background-color = "#1a1a2e"
    sidebar-text-color = "#e0e0e0"
    sidebar-selected-icon-color = primary-color

// Dark mode (algorithmic inversion)
if (darkMode):
    dark.primary-background-color  = darken(surfaceHue, 85%)
    dark.card-background-color     = darken(surfaceHue, 75%)
    dark.primary-text-color        = "#e0e0e0"
    dark.secondary-text-color      = "#9e9e9e"
    dark.divider-color             = "rgba(255,255,255, 0.12)"
    // etc.

// Card border (based on borderStyle setting)
if borderStyle == "none":
    ha-card-border-color = card-background-color  // invisible
    ha-card-box-shadow = "0 2px 8px rgba(0,0,0,0.08)"
else if borderStyle == "subtle":
    ha-card-border-color = divider-color  // default
else if borderStyle == "visible":
    ha-card-border-color = secondary-background-color
```

### 7.4 Output Format

The generator outputs a YAML block ready to paste into `configuration.yaml`, plus optionally a preview render. The output object is structured:

```javascript
function generateTheme(inputs) {
  const light = computeLightVars(inputs);
  const dark = inputs.darkMode ? computeDarkVars(inputs, light) : null;

  const theme = {
    ...light,  // top-level = mode-independent + light base
    ...(dark ? {
      modes: {
        light: {},  // empty, top-level vars handle light
        dark: dark
      }
    } : {})
  };

  return yamlSerialize({ frontend: { themes: { [inputs.themeName]: theme } } });
}
```

### 7.5 Algorithmic Relationships Reference Table

| Output Variable | Derived From | Algorithm |
|----------------|--------------|-----------|
| `dark-primary-color` | `primary-color` | Lab darken by 1 step |
| `darker-primary-color` | `primary-color` | Lab darken by 2 steps |
| `light-primary-color` | `primary-color` | Lab brighten by 1 step |
| `text-primary-color` | `primary-color` | WCAG contrast check vs. #212121; white if < 4.5:1 |
| `rgb-primary-color` | `primary-color` | hex2rgb, join with commas (auto-generated by HA) |
| `text-accent-color` | `accent-color` | Same WCAG contrast check |
| `sidebar-icon-color` | `sidebar-text-color` | `rgba(…, 0.60)` |
| `state-icon-color` | `dark-primary-color` | Direct alias |
| Dark bg colors | `surfaceHue` | HSL lightness reduce by 70–80% |
| Dark divider | `primary-text-color` | `rgba(r,g,b, 0.12)` where rgb = light text |

### 7.6 Recommended Tech Stack

```
Input layer:  Color picker (e.g. Coloris or vanilla <input type=color>)
              Sliders for numeric tokens
              Presets/starting templates

Logic layer:  Pure JS/TS functions mirroring HA's own color math:
              - hex2rgb, rgb2lab, lab2rgb (from HA source: common/color/)
              - labBrighten, labDarken
              - rgbContrast
              - generateColorPalette (for --ha-color-primary-* ramp)

Preview layer: An iframe or shadow-root rendering a mock HA UI using
               the generated CSS custom properties
               — set the vars on the container element, not html
               — render: a card, sidebar, entity state pill, button

Output layer: YAML serialization (js-yaml or hand-built template)
              Copy-to-clipboard button
              Download as themes.yaml button
              Live JSON→YAML toggle (show both formats)
```

### 7.7 Preview Rendering Strategy

Because HA uses `var()` on the `html` element, a preview iframe can replicate this by:

```html
<!-- preview-frame.html -->
<style id="ha-defaults">/* paste themeStyles string here (from theme.ts) */</style>
<div id="preview-root" style="/* inject generated vars here */"></div>
```

Or inject vars onto a scoped container in the parent app:
```js
Object.entries(generatedTheme).forEach(([key, val]) => {
  previewEl.style.setProperty(`--${key}`, val);
});
```

No iframe required. Produces instant visual feedback on input change.

---

## Appendix A: Complete List of YAML-Addressable Variable Names

YAML key names (omit `--` prefix). Each maps to `--{key}` as a CSS custom property on `document.documentElement`.

```
# Primary
primary-color, dark-primary-color, darker-primary-color, light-primary-color
accent-color, text-primary-color, text-light-primary-color, text-accent-color

# Backgrounds
primary-background-color, secondary-background-color
card-background-color, clear-background-color

# Text
primary-text-color, secondary-text-color, disabled-text-color

# Dividers
divider-color, outline-color, outline-hover-color, shadow-color, scrollbar-thumb-color

# Status
error-color, warning-color, success-color, info-color, disabled-color

# Sidebar
sidebar-background-color, sidebar-text-color, sidebar-icon-color
sidebar-selected-text-color, sidebar-selected-icon-color
sidebar-menu-button-text-color, sidebar-menu-button-background-color

# App header
app-header-background-color, app-header-text-color
app-header-edit-background-color, app-header-edit-text-color
app-theme-color

# Cards
ha-card-background, ha-card-border-radius, ha-card-border-width
ha-card-border-color, ha-card-box-shadow, ha-card-backdrop-filter
ha-card-header-color, ha-card-header-font-size

# Inputs
input-idle-line-color, input-hover-line-color, input-disabled-line-color
input-outlined-idle-border-color, input-outlined-hover-border-color
input-outlined-disabled-border-color, input-fill-color, input-disabled-fill-color
input-ink-color, input-label-ink-color, input-disabled-ink-color
input-dropdown-icon-color

# Misc UI
bar-box-shadow, label-badge-background-color, label-badge-text-color
table-header-background-color, table-row-background-color
table-row-alternative-background-color, data-table-background-color
markdown-code-background-color, state-icon-color

# State colors (sampled — full list follows domain patterns)
state-active-color, state-inactive-color, state-unavailable-color
state-light-active-color, state-switch-active-color
state-climate-heat-color, state-climate-cool-color
state-alarm_control_panel-triggered-color
state-media_player-active-color, state-media_player-inactive-color
# ... all --state-{domain}-{device_class?}-{state}-color patterns

# Energy
energy-grid-consumption-color, energy-grid-return-color
energy-solar-color, energy-non-fossil-color
energy-battery-out-color, energy-battery-in-color
energy-gas-color, energy-water-color

# Named colors (for custom state color mapping)
red-color, pink-color, purple-color, deep-purple-color, indigo-color
blue-color, light-blue-color, cyan-color, teal-color, green-color
light-green-color, lime-color, yellow-color, amber-color, orange-color
deep-orange-color, brown-color, light-grey-color, grey-color
dark-grey-color, blue-grey-color

# Slider
slider-color, slider-secondary-color, slider-track-color

# Label badges
label-badge-red, label-badge-blue, label-badge-green, label-badge-yellow, label-badge-grey

# Chip
ha-assist-chip-filled-container-color, ha-assist-chip-active-container-color
chip-background-color

# Graph palette
color-1 through color-54
```

## Appendix B: Source File Map

```
src/resources/theme/
├── theme.ts                          ← assembly barrel
├── core.globals.ts                   ← spacing, radius, animation tokens
├── main.globals.ts                   ← layout, safe-area, opacity tokens
├── typography.globals.ts             ← font system
├── semantic.globals.ts               ← box shadows (non-color)
├── animations.globals.ts             ← @keyframes
├── wa.globals.ts                     ← WebAwesome structural tokens
└── color/
    ├── index.ts                      ← color barrel
    ├── core.globals.ts               ← raw color palette ramps
    ├── semantic.globals.ts           ← intent-mapped color tokens
    ├── color.globals.ts              ← legacy/public HA color vars
    └── wa.globals.ts                 ← WebAwesome color bridge

src/common/
├── dom/apply_themes_on_element.ts    ← YAML→CSS engine
└── style/derived-css-vars.ts        ← CSS parsing utilities

src/state/
└── themes-mixin.ts                   ← theme subscription + application lifecycle
```
