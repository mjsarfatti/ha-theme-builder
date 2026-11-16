import { describe, expect, it } from "vitest";
import { derive, modeVars } from "@/engine";
import { getHaVariable, HA_VARIABLES } from "../index.ts";

// Names that HA reads in a var() but does not declare in src/resources/theme/.
const EXTERNAL = new Set([
  // Set by the companion apps on `html`; main.globals.ts falls back to env().
  "app-safe-area-inset-top",
  "app-safe-area-inset-bottom",
  "app-safe-area-inset-left",
  "app-safe-area-inset-right",
  // Optional theme hooks, read with a fallback.
  "state-icon-unavailable-color",
  "error-state-color",
  "ha-dialog-surface-background",
  // HA defects: color/semantic.globals.ts reads names that no file declares.
  "ha-color-neutral-00",
  "ha-color-90",
]);

// Engine output that the catalogue does not contain. Empty: every variable resolves.
const ENGINE_EXCEPTIONS = new Set<string>([]);

describe("HA variable catalogue", () => {
  it("has no duplicate names", () => {
    const names = HA_VARIABLES.map((v) => v.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("resolves every reference to an entry or to the external allowlist", () => {
    const unresolved = HA_VARIABLES.flatMap((v) =>
      v.references.filter((r) => !getHaVariable(r) && !EXTERNAL.has(r)).map((r) => `${v.name} -> ${r}`),
    );
    expect(unresolved).toEqual([]);
  });

  it("uses every external allowlist entry", () => {
    const referenced = new Set(HA_VARIABLES.flatMap((v) => v.references));
    expect([...EXTERNAL].filter((name) => !referenced.has(name) || getHaVariable(name))).toEqual([]);
  });

  it("contains every variable that the engine emits for the default config", () => {
    const theme = derive();
    const emitted = new Set([...Object.keys(modeVars(theme, "light")), ...Object.keys(modeVars(theme, "dark"))]);
    expect([...emitted].filter((name) => !getHaVariable(name) && !ENGINE_EXCEPTIONS.has(name))).toEqual([]);
    expect([...ENGINE_EXCEPTIONS].filter((name) => getHaVariable(name) || !emitted.has(name))).toEqual([]);
  });
});
