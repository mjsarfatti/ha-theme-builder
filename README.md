# Home Assistant / Theme Builder

A tool that builds and customizes themes for Home Assistant.

## Development

**Prerequisites:**

- Node.js 24 or later. The version is in `.nvmrc`. CI uses the same version in the
  `runtime` input of its `pnpm/setup` step.
- [pnpm](https://pnpm.io/) 11 or later. Run `corepack enable` to use the version in
  `packageManager` in `package.json`.

Install the dependencies and start the development server:

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
A push to `main` builds the app and deploys it to GitHub Pages.
