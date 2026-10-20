# Preview pane — dev harness

The harness runs the preview pane on its own, without the app shell. It is scaffolding and
is not part of the app shell.

Its own `vite.config.ts` aliases `@` to `src` by hand, so the harness does not change the
root `vite.config.ts`. `dev.css` imports the real `src/index.css` and adds one `@source`
directive. The Vite `root` of the harness is inside `src/`, which stops the automatic class
detection of Tailwind from reaching the rest of the tree.

Run the harness from the repo root:

```
pnpm exec vite --config src/components/preview/dev/vite.config.ts
```

The harness serves `<Preview theme={derive(fixture)} />` with a fixture picker. The fixtures are:

- `DEFAULT_CONFIG`
- a re-tinted ramp and palette
- a primary color that triggers the §4.3 contrast warning
- the `"match-card"` sentinel of the border knob

The whole preview pane is reachable without the sidebar.

The production build excludes the harness. `vite build` from the repo root ignores this
directory, because `src/App.tsx` does not import it.
