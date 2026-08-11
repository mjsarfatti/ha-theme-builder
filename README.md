# Home Assistant / Theme Builder

A tool for building and customizing themes for Home Assistant.

## Development

**Prerequisites:** Node.js 24+ (the version in `.nvmrc`, which CI reads too) and
[pnpm](https://pnpm.io/) 11+ (`corepack enable` will pick up the pinned version from
`packageManager` in `package.json`).

```bash
pnpm install
pnpm dev        # start the Vite dev server
```

Other scripts:

```bash
pnpm build      # type-check and build for production (dist/)
pnpm preview    # preview the production build locally
pnpm lint       # oxlint
pnpm typecheck  # tsc --build, no emit
pnpm test       # vitest run
```

CI runs lint, typecheck, test, and build on every push and pull request.
Pushes to `main` build and deploy the app to GitHub Pages.
