# HA Theme Builder — working rules

A self-contained web app for building Home Assistant themes: a sidebar of knobs, a
live preview of tokens and HA cards, and paste-ready YAML output.

**Read `docs/PLAN.md` first.** It is the agreed product plan — scope, decisions,
architecture, milestones. Do not change it without a PM decision.

## Never assume tool or library versions — verify them

Your training data is out of date. It is *always* out of date, by more than you
expect, and this project has already been bitten by it.

Before adding a dependency, pinning a version, or stating what "current" is:

- Check the actual latest version: `curl -sS https://registry.npmjs.org/<pkg>/latest`
  (the npm registry is reachable directly, not through the egress proxy), or use
  the Context7 MCP tools for library documentation, or search the web.
- Check the **major** version, not just the patch. Getting a major wrong means
  reading documentation for software that no longer works the way you think.
- When a package is only days or weeks old, verify it is actually usable with the
  rest of this stack before adopting it — read the release notes for known
  ecosystem gaps. Recency alone is not a reason to adopt; a *verified* upgrade is.
- Prefer current versions. If you deliberately stay behind latest, say so in your
  PR body with the reason.

The same applies to GitHub Actions versions, CLI flags, and framework APIs. If you
are about to write a version number or a flag from memory, stop and check it.

## Toolchain

- **pnpm only.** Never npm or yarn. The version is pinned in `package.json` via
  `packageManager`.
- Scripts: `pnpm dev`, `build`, `preview`, `lint`, `typecheck`, `test`.
- All five of lint / typecheck / test / build must pass before a PR is handed back.
  Do not hand back a red PR.

## Boundaries

- **`.references/` is read-only.** It is the source material this product is built
  from: the HA theme-system analysis (authoritative spec), `template.css` (the knob
  spec — `KNOB` means a user control, `DERIVED` means you compute it, and the
  `NOTE:` comments are product requirements), the colour-ramp and palette pages
  (preset source data), and the Claude design artifact (preview blueprint). Read it
  constantly; never modify it.
- **`src/engine/` is pure TypeScript.** No React imports, no DOM access. It maps a
  seed config to token maps and YAML, and it is unit-tested. The UI is a thin shell
  over it.
- **Generated HA theme variables are never set on `:root`.** They go on scoped
  preview containers, so the builder's own shadcn/Tailwind styling cannot leak into
  the preview and vice versa.

## Product constraints already decided

- Light and dark previews are shown **at the same time**, side by side. There is no
  mode toggle.
- Ramps and palettes are **presets only** in v1, taken verbatim from
  `.references/colors/`. No custom colour-space controls.
- **Never use the browser-native colour input.** Seed colours use a custom picker
  that can also pick from the active ramp and palette.
- Home Assistant ships only Roboto, so any other font needs an `extra_module_url`
  loading snippet shipped alongside the exported YAML.

## Network

Sessions run behind an egress proxy with an allowlist. `registry.npmjs.org` and
`raw.githubusercontent.com` are reachable; `ui.shadcn.com`, `unpkg.com` and
`cdn.jsdelivr.net` are currently **not**. A 403 on CONNECT is an organisation policy
denial — report the blocked host, and never try to route around it or disable TLS
verification. Diagnose with `curl -sS "$HTTPS_PROXY/__agentproxy/status"`.
