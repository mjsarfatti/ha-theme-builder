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
A push to `main` builds the app and deploys it to the root of the `gh-pages` branch,
which GitHub Pages serves.

## Pull request previews

Each pull request from this repository gets a live preview. The workflow
`.github/workflows/preview.yml` builds the pull request with `BASE_PATH` set to the
preview path. It deploys the build to a directory of the `gh-pages` branch and posts
the link as a comment on the pull request. Each push updates the preview and the
comment. When the pull request closes or merges, the workflow removes the preview.

The preview URL has this form:

```
https://<owner>.github.io/ha-theme-builder/pr-preview/pr-<number>/
```

A pull request from a fork gets no preview. The workflow has no write access for it.
The `main` deploy keeps the `pr-preview/` directory.

**One-time repository setting:** Settings, Pages, Source: "Deploy from a branch",
Branch: `gh-pages`, Folder: `/ (root)`.

`BASE_PATH` sets the Vite `base` option. A build without it uses `/ha-theme-builder/`.
