# Preview pane — dev harness

A standalone way to run and see this milestone's work before the app shell
(M4) exists to mount it. This is scaffolding, not part of the app shell —
its own `vite.config.ts` re-aliases `@` to `src` by hand, so it never touches
the root `vite.config.ts`. `dev.css` imports the real `src/index.css` and adds
one `@source` directive, because this harness's own Vite `root` sits inside
`src/`, which stops Tailwind's automatic class detection from reaching the
rest of the tree.

Run it from the repo root:

```
pnpm exec vite --config src/components/preview/dev/vite.config.ts
```

It serves `<Preview theme={derive(fixture)} />` with a fixture picker —
`DEFAULT_CONFIG`, a re-tinted ramp and palette, a primary color that trips
the §4.3 contrast warning, and the border knob's `"match-card"` sentinel —
so the whole preview pane is reachable without the sidebar.

Not part of the production build: `vite build` from the repo root ignores
this directory entirely, since nothing under `src/App.tsx` imports it.
