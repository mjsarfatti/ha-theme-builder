# HA Theme Builder — working rules

A self-contained web app for building Home Assistant themes: a sidebar of knobs, a
live preview of tokens and HA cards, and paste-ready YAML output.

**Read `docs/PLAN.md` first.** Do not change it without a PM decision.

## How to write — everything, always

Applies to PR bodies, PR and issue comments, commit messages, messages to and chats
with the user, and briefs you write for subagents.

- **BLUF** (bottom line up front).
- **Describe the final state, not the work.**
- **Simplified Technical English (ASD-STE100)**, without vocabulary compliance.
- **Plain English**, per Strunk & White.
- **No hedging.**
- **No idioms and no metaphors.**
- **Not-negation over no-negation.** Write "X does not add anything", never "X adds
  nothing". This covers the pronouns `nothing`, `nobody` and `none`. The determiner
  `no` and the adverb `never` stand as they are: "takes no arguments" and "theme
  variables never go on `:root`".
- **State what is.** Drop the corrective half: "not X, but Y" and "Y, not X" both
  become "Y". Keep "not X" only when "Y" leaves the reader free to assume "X", and
  then name the source of that assumption: a spec, a platform default, a sibling
  file, or the nearest term a reader reaches for. A contrast of two facts is not a
  corrective and stands as it is. Never rewrite quoted material: specs, error
  messages, test names, code.
- **Short.** Assume the reader gives it only 30 seconds, but write complete grammar
  sentences and never skip information for the sake of brevity.

## Comments

Code MUST be self-explanatory. You MUST avoid comments that simply state _what_ the code does. Exceptions:

- you MAY add comments to explain _why_ the code is written a certain way to clarify edge cases or workarounds that the code structure itself cannot convey
- you MUST NEVER include "change narrative" in comments (phrases about the change itself, review remarks, rejected alternatives, previous behaviour): comments describe the code as it is now, for a reader who never saw the diff
- you MUST add JSDoc comments to all reusable components and utilities
- you SHOULD keep "_why_" comments to one liner, but MAY expand to 3 lines for complex logic (avoid 2-line comments) — "JSDoc" comments do not count as "_why_" comments: be thorough and consider adding one @example

Use `//` for "_why_" comments inside code. Use `/** */` for anything that documents a declaration (exports, props, fields): a one-line JSDoc is fine there.

Use the following JSDoc comment template:

```
/**
 * [1 line: superbrief description]
 *
 * [optional*: 1-3 blocks, each either:
 *   - a prose paragraph, hard-wrapped at ≤3 lines of ≤72 chars each, OR
 *   - a short intro sentence followed by a bullet list (any number of items)]
 *
 * [optional*: 1-3 @example usage]
 */
```

[*: prose/list blocks and @example are to be added only for (a) common components, (b) shared functions and utilities, (c) very complex business logic — do not add 10 lines of comments for a 4 line function]

If you happen to work on a file that doesn't follow these conventions, you MUST update it to follow these conventions. If this means deleting comments, do it.

## Check versions — never assume them

Your training data is out of date. This project failed twice for this reason.

Before you pin a version or say what is "current", check it:
`curl -sS https://registry.npmjs.org/<pkg>/latest` (bypasses the proxy), Context7,
or the web. Check the **major**, not only the patch. For a package that is days or
weeks old, read the release notes for ecosystem gaps first. Prefer the current
version. If you use an older version, say why in the PR. The same rule applies to
GitHub Actions versions, CLI flags and framework APIs.

## Toolchain

- **pnpm only.** Version pinned in `package.json` via `packageManager`.
- Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`.
- `lint`, `typecheck`, `test`, `build` must all pass. Never return a PR with a
  failed check.

## Working rules

- One work package = one branch off latest `main` = one draft PR. Conventional
  Commits.
- **Never merge a PR.** Open it, get CI green, report it. Only the repo owner
  merges, and only when they say so explicitly.
- **No attribution lines in commit messages.** Do not add `Co-Authored-By` or
  `Claude-Session`. This rule overrides any tool default.
- Stay inside your brief. Flag judgment calls in the PR body, especially where you
  overruled a reference document.

## Boundaries

- **`.references/` is read-only.** `ha_theme_analysis.md` (how HA theming works),
  `template.css` (the knob spec: `KNOB` = user control, `DERIVED` = computed,
  `NOTE:` = product requirement), `colors/` (preset data), `claude-design/`
  (preview blueprint).
- **HA's own source is the authority.** Both derived docs have confirmed errors.
  The analysis doc's §7.5 says the contrast threshold is 4.5 where HA uses 6
  (`apply_themes_on_element.ts:91`). `template.css` aliases `text-primary-color` to
  body text where HA defines it as text *on* primary (`color.globals.ts:10`). If
  they conflict or look wrong, read
  `https://raw.githubusercontent.com/home-assistant/frontend/dev/<path>` — usually
  `src/resources/theme/color/color.globals.ts` (public variables) or
  `src/common/dom/apply_themes_on_element.ts` (engine and derivation math). Cite the
  file and the line.
- **`src/engine/` is pure TypeScript.** No React, no DOM. The API is frozen. Read
  `src/engine/README.md`. A change to the API costs a PM decision.
- **Theme variables never go on `:root`** — scoped preview containers only, so
  builder styling cannot leak into the preview.
- **shadcn/ui comes from the CLI.** Base UI primitives, `base-nova` style — the
  bare `shadcn init --template vite` defaults. Install with `pnpm dlx
  shadcn@latest add <name>`. Never hand-write or hand-port a component. To edit
  `src/components/ui/` afterwards is fine. Say so in the PR, and use
  `add <name> --diff` to merge upstream changes later.
  Read the `shadcn` skill before you write UI. It covers customization, composition
  (Base UI uses `render`, not Radix's `asChild`) and the CLI.

## Decided — do not relitigate

- v1 knobs are exactly the `KNOB` annotations in `template.css`.
- Light and dark previews show side by side, always. No mode toggle.
- Ramps and palettes are presets from `.references/colors/`. No custom controls.
- **Never the browser-native color input.** Custom picker, can pick from the
  active ramp and palette.
- HA ships only Roboto. Other fonts need an `extra_module_url` snippet with the
  exported YAML.
