import { describe, expect, it } from "vitest";
import { parse } from "yaml";

import { derive, modeVars } from "../derive.ts";
import type { DerivedTheme, ThemeMode } from "../types.ts";
import { quoteYamlScalar, toYaml } from "../yaml.ts";

interface ParsedTheme {
  modes: Record<ThemeMode, Record<string, string>>;
  [key: string]: unknown;
}

function parseTheme(yaml: string, name = "My Theme"): ParsedTheme {
  const doc = parse(yaml) as Record<string, ParsedTheme>;
  const theme = doc[name];
  expect(theme, `theme "${name}" missing from output`).toBeDefined();
  return theme;
}

/** Everything HA would end up with for one mode: top-level plus the mode block. */
function flatten(theme: ParsedTheme, mode: ThemeMode): Record<string, string> {
  const { modes, ...top } = theme;
  return { ...(top as Record<string, string>), ...modes[mode] };
}

describe("quoteYamlScalar", () => {
  it("always quotes, so a leading # can never start a comment", () => {
    expect(quoteYamlScalar("#009ac7")).toBe('"#009ac7"');
    expect(quoteYamlScalar("1")).toBe('"1"');
    expect(quoteYamlScalar("0, 154, 199")).toBe('"0, 154, 199"');
  });

  it("switches to single quotes for values containing double quotes", () => {
    expect(quoteYamlScalar('"Inter", Roboto, sans-serif')).toBe(
      `'"Inter", Roboto, sans-serif'`,
    );
  });

  it("escapes when a value contains both quote characters", () => {
    expect(quoteYamlScalar(`a"b'c`)).toBe(`"a\\"b'c"`);
  });

  it("escapes backslashes", () => {
    expect(quoteYamlScalar("a\\b")).toBe('"a\\\\b"');
  });

  it("round-trips through a real YAML parser", () => {
    for (const value of [
      "#009ac7",
      "#1414141f",
      "0, 154, 199",
      "1",
      "yes",
      "null",
      "0 1px 2px 0 #14141414, 0 1px 3px 0 #1414141f",
      '"DM Sans", Roboto, Noto, sans-serif',
      "Roboto, Noto, sans-serif",
      "a: b",
      "- not a list",
      `it's`,
      `mixed "quotes" and 'apostrophes'`,
    ]) {
      expect(parse(`k: ${quoteYamlScalar(value)}`), value).toEqual({ k: value });
    }
  });
});

describe("toYaml — structure", () => {
  const theme = derive();
  const yaml = toYaml(theme);

  it("parses as valid YAML", () => {
    expect(() => parse(yaml)).not.toThrow();
  });

  it("keys the theme by name, with a modes block holding both modes", () => {
    const parsed = parseTheme(yaml);
    expect(Object.keys(parsed.modes).sort()).toEqual(["dark", "light"]);
  });

  it("uses the config name, overridable per call", () => {
    expect(toYaml(derive({ name: "Ocean" }))).toContain("Ocean:");
    expect(toYaml(theme, { name: "Renamed" })).toContain("Renamed:");
  });

  it("emits bare keys, without the -- prefix", () => {
    const parsed = parseTheme(yaml);
    expect(parsed["primary-color"]).toBe("#009ac7");
    expect(yaml).not.toContain("--primary-color");
  });

  it("optionally wraps in frontend: themes: for configuration.yaml", () => {
    const wrapped = toYaml(theme, { wrapper: "frontend" });
    const doc = parse(wrapped) as { frontend: { themes: Record<string, ParsedTheme> } };
    expect(doc.frontend.themes["My Theme"]["primary-color"]).toBe("#009ac7");
    expect(doc.frontend.themes["My Theme"].modes.dark["card-background-color"]).toBe("#202020");
  });

  it("can drop the header and the section comments", () => {
    const bare = toYaml(theme, { header: false, comments: false });
    expect(bare.startsWith("My Theme:")).toBe(true);
    expect(bare).not.toContain("# ");
    // Still parses, and still carries every value.
    expect(parseTheme(bare)["primary-color"]).toBe("#009ac7");
  });

  it("warns about fonts HA cannot load, and stays quiet when there are none", () => {
    const withFont = toYaml(derive({ fonts: { body: "inter" } }));
    expect(withFont).toContain("Inter");
    expect(withFont).toContain("extra_module_url");
    // Default config is Roboto + system faces, so there is nothing to load.
    expect(toYaml(theme)).not.toContain("extra_module_url");
  });
});

describe("toYaml — the round trip HA would perform", () => {
  const theme = derive({ colors: { primary: "#7c5cff" }, neutralRamp: "mauve" });
  const parsed = parseTheme(toYaml(theme));

  it("reads every hex value back as a string, not a comment or a number", () => {
    for (const mode of ["light", "dark"] as const) {
      for (const [key, value] of Object.entries(flatten(parsed, mode))) {
        expect(typeof value, `${mode}.${key}`).toBe("string");
        expect(value, `${mode}.${key}`).not.toBe("");
      }
    }
  });

  it("reproduces the engine's variable map exactly for each mode", () => {
    for (const mode of ["light", "dark"] as const) {
      const expected = modeVars(theme, mode);
      const actual = flatten(parsed, mode);
      for (const [key, value] of Object.entries(actual)) {
        expect(value, key).toBe(expected[key]);
      }
    }
  });

  it("loses nothing except the rgb companions HA regenerates", () => {
    for (const mode of ["light", "dark"] as const) {
      const expected = modeVars(theme, mode);
      const actual = flatten(parsed, mode);
      const dropped = Object.keys(expected).filter((k) => !(k in actual));
      // Every dropped key is an rgb-* whose base is a hex value, which is
      // exactly what processTheme() auto-derives (analysis §4.1 step 5).
      for (const key of dropped) {
        expect(key, key).toMatch(/^rgb-/);
        const base = expected[key.slice("rgb-".length)];
        expect(base, `base of ${key}`).toMatch(/^#/);
      }
      expect(dropped.length).toBeGreaterThan(0);
    }
  });
});

describe("toYaml — rgb companion rule", () => {
  it("omits every rgb-* companion when all bases are hex", () => {
    const yaml = toYaml(derive());
    expect(yaml).not.toContain("rgb-primary-color");
    expect(yaml).not.toContain("rgb-card-background-color");
  });

  it("emits an rgb companion when HA could not derive it", () => {
    // Simulate a non-hex base — HA only auto-derives for values starting "#".
    const base = derive();
    const theme: DerivedTheme = {
      ...base,
      common: {
        ...base.common,
        "primary-color": "rgb(124, 92, 255)",
        "rgb-primary-color": "124, 92, 255",
      },
    };
    const yaml = toYaml(theme);
    expect(yaml).toContain("rgb-primary-color:");
    expect(parseTheme(yaml)["rgb-primary-color"]).toBe("124, 92, 255");
  });
});

describe("toYaml — snapshots", () => {
  it("default config", async () => {
    await expect(toYaml(derive())).toMatchFileSnapshot("./__snapshots__/default.yaml");
  });

  it("non-default ramp, palette, fonts and seeds", async () => {
    const theme = derive({
      name: "Nightshade",
      fonts: {
        body: "figtree",
        heading: "fraunces",
        longform: "source-serif-4",
        code: "jetbrains-mono",
      },
      colors: {
        primary: "#7c5cff",
        error: "#b00020",
        warning: "#e0a100",
        success: "#2e7d32",
        accent: "#ff4081",
        info: "#00b0ff",
      },
      neutralRamp: "mauve",
      palette: "tailwind-v4",
      borderColor: "neutral-20",
      cardBackground: "neutral-95",
      primaryBackground: "neutral-90",
    });
    await expect(toYaml(theme)).toMatchFileSnapshot("./__snapshots__/nightshade.yaml");
  });

  it("configuration.yaml wrapper", async () => {
    await expect(
      toYaml(derive(), { wrapper: "frontend", comments: false }),
    ).toMatchFileSnapshot("./__snapshots__/wrapped.yaml");
  });
});
