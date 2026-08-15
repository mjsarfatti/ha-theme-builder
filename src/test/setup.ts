import "@testing-library/jest-dom/vitest"

// jsdom doesn't implement `matchMedia`. `ThemeProvider` (§1.1's Auto/Light/Dark
// toggle) reads it to resolve "auto", so any test that mounts the app shell
// needs this stub. `matches: false` keeps the default resolved theme "light".
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
