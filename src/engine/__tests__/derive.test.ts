import { describe, expect, it } from "vitest";

import { normalizeHex, rgbTriplet, withAlpha } from "../color.ts";
import {
  DEFAULT_CONFIG,
  derive,
  modeVars,
  neutralRampAt,
  resolveConfig,
  toCssProperties,
} from "../derive.ts";
import { contrastingText } from "../ha-math.ts";
import { getExtendedPalette, getNeutralRamp, KNOB_SLOT } from "../presets/index.ts";
import { RAMP_SLOTS } from "../types.ts";
import { parseTemplateCss, templateCssKeys } from "./template-css.ts";

/** `#ccc` / `#0003` in template.css mean the same thing as their long forms. */
function expand(value: string): string {
  // Only hex literals are normalised — font stacks keep their casing.
  return value.replace(/#([0-9a-fA-F]{3,8})\b/g, (_m, digits: string) => {
    const d = digits.toLowerCase();
    return `#${d.length === 3 || d.length === 4 ? [...d].map((c) => c + c).join("") : d}`;
  });
}

/**
 * Every variable where the engine's output differs from the literal value in
 * `template.css`, with the reason why. A test below asserts each entry still
 * differs, so an entry that stops applying fails the suite.
 */
const DEVIATIONS: Record<string, string> = {
  // NOTE: "Derive using --ha-color-neutral-05 as base" — template.css still
  // shows the black-based values HA ships today.
  "ha-box-shadow-s": "neutral-05 base",
  "ha-box-shadow-m": "neutral-05 base",
  "ha-box-shadow-l": "neutral-05 base",
  "input-idle-line-color": "neutral-05 base",
  "input-hover-line-color": "neutral-05 base",
  "input-disabled-line-color": "neutral-05 base",
  "input-outlined-idle-border-color": "neutral-05 base",
  "input-outlined-hover-border-color": "neutral-05 base",
  "input-outlined-disabled-border-color": "neutral-05 base",
  "input-ink-color": "neutral-05 base",
  "input-label-ink-color": "neutral-05 base",
  "input-disabled-ink-color": "neutral-05 base",
  "input-dropdown-icon-color": "neutral-05 base",
  "divider-color": "border knob defaults to the neutral ramp, not black",
  "outline-color": "follows divider-color",
  "outline-hover-color": "follows divider-color",
  "shadow-color": "neutral-05 base, independent of the border knob",

  // HA's own WCAG rule rather than template.css's alias — see README.
  "text-primary-color": "WCAG contrast against the primary colour",
  "text-light-primary-color": "WCAG contrast against light-primary-color",

  // The knob is restricted to the neutral ramp, and #fafafa is not on it.
  "primary-background-color": "nearest on-ramp value to HA's #fafafa",
  "secondary-background-color": "one ramp step below the page background",

  // template.css's rgb-* literals were copied from HA's legacy colours and do
  // not match template.css's own values. We derive them from ours instead.
  "rgb-primary-text-color": "stale literal in template.css",
  "rgb-secondary-text-color": "stale literal in template.css",
  "rgb-warning-color": "stale literal in template.css",
  "rgb-error-color": "stale literal in template.css",
  "rgb-success-color": "stale literal in template.css",
};

describe("the default config reproduces HA's current theme", () => {
  const template = parseTemplateCss();
  const light = modeVars(derive(), "light");

  it("emits every variable template.css declares", () => {
    const missing = templateCssKeys().filter((key) => !(key in light));
    expect(missing).toEqual([]);
  });

  it("matches template.css exactly for every non-deviating variable", () => {
    const mismatches: string[] = [];
    for (const key of templateCssKeys()) {
      if (key in DEVIATIONS) continue;
      if (light[key] !== expand(template[key])) {
        mismatches.push(`${key}: expected ${expand(template[key])}, got ${light[key]}`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("keeps the deviation list honest — every entry still deviates", () => {
    const noLongerDeviating = Object.keys(DEVIATIONS).filter(
      (key) => light[key] === expand(template[key]),
    );
    expect(noLongerDeviating).toEqual([]);
  });

  it("deviates in exactly the documented places and nowhere else", () => {
    const actual = templateCssKeys()
      .filter((key) => light[key] !== expand(template[key]))
      .sort();
    expect(actual).toEqual(Object.keys(DEVIATIONS).sort());
  });

  it("adds only text-accent-color beyond template.css", () => {
    // §5.3: text-accent-color must be set alongside accent-color, because HA
    // never derives it for a YAML theme.
    const known = new Set(templateCssKeys());
    expect(Object.keys(light).filter((k) => !known.has(k))).toEqual(["text-accent-color"]);
  });

  it("keeps every rgb companion consistent with its own base value", () => {
    for (const [key, value] of Object.entries(light)) {
      if (!key.startsWith("rgb-")) continue;
      const base = light[key.slice("rgb-".length)];
      expect(base, `base for ${key}`).toBeDefined();
      expect(value, key).toBe(rgbTriplet(base));
    }
  });
});

describe("derive — config handling", () => {
  it("fills partial configs in from the defaults", () => {
    const config = resolveConfig({ colors: { primary: "#7c5cff" } });
    expect(config.colors.primary).toBe("#7c5cff");
    expect(config.colors.accent).toBe(DEFAULT_CONFIG.colors.accent);
    expect(config.fonts).toEqual(DEFAULT_CONFIG.fonts);
    expect(config.neutralRamp).toBe("ha");
  });

  it("does not mutate DEFAULT_CONFIG", () => {
    const before = structuredClone(DEFAULT_CONFIG);
    derive({ colors: { primary: "#ff0000" }, neutralRamp: "mauve" });
    expect(DEFAULT_CONFIG).toEqual(before);
  });

  it("is deterministic", () => {
    const a = derive({ colors: { primary: "#7c5cff" }, neutralRamp: "stone" });
    const b = derive({ colors: { primary: "#7c5cff" }, neutralRamp: "stone" });
    expect(a.common).toEqual(b.common);
    expect(a.light).toEqual(b.light);
    expect(a.dark).toEqual(b.dark);
  });

  it("rejects a malformed seed colour", () => {
    expect(() => derive({ colors: { primary: "not-a-colour" } })).toThrow(TypeError);
    expect(() => derive({ colors: { accent: "#12345" } })).toThrow(TypeError);
  });

  it("rejects unknown preset and font ids", () => {
    // @ts-expect-error deliberately invalid id
    expect(() => derive({ neutralRamp: "nope" })).toThrow(RangeError);
    // @ts-expect-error deliberately invalid id
    expect(() => derive({ palette: "nope" })).toThrow(RangeError);
    expect(() => derive({ fonts: { body: "nope" } })).toThrow(RangeError);
  });

  it("reports the fonts needing a loader, deduplicated, Roboto excluded", () => {
    expect(derive().webfonts).toEqual([]);
    const theme = derive({ fonts: { body: "inter", heading: "inter", code: "jetbrains-mono" } });
    expect(theme.webfonts.map((f) => f.id)).toEqual(["inter", "jetbrains-mono"]);
  });
});

describe("derive — knobs reach their variables", () => {
  it("places each seed at its own ramp slot, verbatim", () => {
    const theme = derive({
      colors: {
        primary: "#7c5cff",
        error: "#b00020",
        warning: "#e0a100",
        success: "#2e7d32",
      },
    });
    expect(theme.common[`ha-color-primary-${KNOB_SLOT.primary}`]).toBe("#7c5cff");
    expect(theme.common["ha-color-red-50"]).toBe("#b00020");
    expect(theme.common["ha-color-orange-70"]).toBe("#e0a100");
    expect(theme.common["ha-color-green-60"]).toBe("#2e7d32");

    // ...and the legacy aliases follow the slots.
    expect(theme.common["primary-color"]).toBe("#7c5cff");
    expect(theme.common["error-color"]).toBe("#b00020");
    expect(theme.common["warning-color"]).toBe("#e0a100");
    expect(theme.common["success-color"]).toBe("#2e7d32");
  });

  it("binds the primary family to ramp slots 30/20/50", () => {
    const theme = derive({ colors: { primary: "#7c5cff" } });
    expect(theme.common["dark-primary-color"]).toBe(theme.common["ha-color-primary-30"]);
    expect(theme.common["darker-primary-color"]).toBe(theme.common["ha-color-primary-20"]);
    expect(theme.common["light-primary-color"]).toBe(theme.common["ha-color-primary-50"]);
  });

  it("recomputes the on-colour text when the primary or accent changes", () => {
    const dark = derive({ colors: { primary: "#101820", accent: "#101820" } });
    expect(dark.common["text-primary-color"]).toBe("#ffffff");
    expect(dark.common["text-accent-color"]).toBe("#ffffff");
    const pale = derive({ colors: { primary: "#ffe08a", accent: "#ffe08a" } });
    expect(pale.common["text-primary-color"]).toBe("#212121");
    expect(pale.common["text-accent-color"]).toBe("#212121");
    expect(pale.common["text-primary-color"]).toBe(contrastingText("#ffe08a"));
  });

  it("swaps in the whole neutral ramp", () => {
    const theme = derive({ neutralRamp: "mauve" });
    const mauve = getNeutralRamp("mauve").ramp;
    for (const slot of RAMP_SLOTS) {
      expect(theme.common[`ha-color-neutral-${String(slot).padStart(2, "0")}`]).toBe(mauve[slot]);
    }
    // The ramp reaches everything derived from it, not just the raw tokens.
    expect(theme.light["primary-text-color"]).toBe(mauve[5]);
    expect(theme.light["divider-color"]).toBe(`${mauve[5]}1f`);
    expect(theme.light["input-fill-color"]).toBe(mauve[95]);
    expect(theme.light["ha-box-shadow-s"]).toContain(mauve[5].slice(1));
  });

  it("swaps in the whole extended palette", () => {
    const theme = derive({ palette: "tailwind-v4" });
    expect(theme.common["red-color"]).toBe("#fb2c36");
    expect(theme.common["blue-grey-color"]).toBe("#62748e");
    // The greys stay on the neutral ramp — they are not palette colours.
    expect(theme.common["grey-color"]).toBe(getNeutralRamp("ha").ramp[60]);
  });

  it("honours the border-colour knob while keeping the 1f alpha", () => {
    const theme = derive({ borderColor: "neutral-40" });
    const ramp = getNeutralRamp("ha").ramp;
    expect(theme.light["divider-color"]).toBe(`${ramp[40]}1f`);
    expect(theme.light["outline-color"]).toBe(`${ramp[40]}1f`);
    expect(theme.light["outline-hover-color"]).toBe(`${ramp[40]}3d`);
    // Dark mirrors the slot: 40 -> 60.
    expect(theme.dark["divider-color"]).toBe(`${ramp[60]}1f`);
  });

  it("honours the background knobs", () => {
    const ramp = getNeutralRamp("ha").ramp;
    const theme = derive({ cardBackground: "neutral-95", primaryBackground: "neutral-90" });
    expect(theme.light["card-background-color"]).toBe(ramp[95]);
    expect(theme.light["primary-background-color"]).toBe(ramp[90]);
    expect(theme.light["secondary-background-color"]).toBe(ramp[80]);
    expect(theme.light["clear-background-color"]).toBe(theme.light["card-background-color"]);
  });

  it("puts the chosen font stacks on the four family variables", () => {
    const theme = derive({
      fonts: { body: "inter", heading: "fraunces", longform: "lora", code: "ibm-plex-mono" },
    });
    expect(theme.common["ha-font-family-body"]).toBe('"Inter", Roboto, Noto, sans-serif');
    expect(theme.common["ha-font-family-heading"]).toBe('"Fraunces", Georgia, serif');
    expect(theme.common["ha-font-family-longform"]).toBe('"Lora", Georgia, serif');
    expect(theme.common["ha-font-family-code"]).toBe(
      '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    );
  });
});

describe("derive — palette-referenced seed colours", () => {
  it("resolves a palette: reference against the config's own palette", () => {
    const theme = derive({ colors: { accent: "palette:blue" } });
    expect(theme.common["accent-color"]).toBe(getExtendedPalette("ha").colors.blue);
    expect(theme.common["accent-color"]).toBe("#2196f3");
  });

  it("re-resolves to a different hex when the palette preset changes", () => {
    const withHa = derive({ colors: { accent: "palette:blue" }, palette: "ha" });
    const withTailwind = derive({ colors: { accent: "palette:blue" }, palette: "tailwind-v4" });
    expect(withHa.common["accent-color"]).toBe("#2196f3");
    expect(withTailwind.common["accent-color"]).toBe("#2b7fff");
    expect(withHa.common["accent-color"]).not.toBe(withTailwind.common["accent-color"]);
  });

  it("resolves references on every colour knob, including the ramp seeds", () => {
    const theme = derive({
      colors: {
        primary: "palette:blue",
        error: "palette:red",
        warning: "palette:amber",
        success: "palette:green",
        info: "palette:cyan",
      },
    });
    const ha = getExtendedPalette("ha").colors;
    expect(theme.common[`ha-color-primary-${KNOB_SLOT.primary}`]).toBe(ha.blue);
    expect(theme.common["ha-color-red-50"]).toBe(ha.red);
    expect(theme.common["ha-color-orange-70"]).toBe(ha.amber);
    expect(theme.common["ha-color-green-60"]).toBe(ha.green);
    expect(theme.common["info-color"]).toBe(ha.cyan);
  });

  it("keeps a literal hex seed literal — it does not follow the palette", () => {
    const withHa = derive({ colors: { accent: "#123456" }, palette: "ha" });
    const withTailwind = derive({ colors: { accent: "#123456" }, palette: "tailwind-v4" });
    expect(withHa.common["accent-color"]).toBe("#123456");
    expect(withTailwind.common["accent-color"]).toBe("#123456");
  });

  it("echoes the reference back in the resolved config, unresolved, for round-tripping", () => {
    const theme = derive({ colors: { accent: "palette:blue" } });
    expect(theme.config.colors.accent).toBe("palette:blue");
    // JSON round-trip: the config the URL / storage layer persists.
    const roundTripped = JSON.parse(JSON.stringify(theme.config));
    expect(roundTripped.colors.accent).toBe("palette:blue");
    expect(derive(roundTripped).common["accent-color"]).toBe(theme.common["accent-color"]);
  });

  it("rejects a reference to a colour the palette does not have", () => {
    // `SeedColor` is `Hex | PaletteRef`, and `Hex` is a plain `string` alias
    // (like every other seed field), so this is not a compile-time error —
    // same posture as `normalizeHex` throwing at runtime on a malformed hex.
    expect(() => derive({ colors: { accent: "palette:nope" } })).toThrow(RangeError);
  });
});

describe("derive — border colour: match-card", () => {
  it("resolves to the current mode's own card colour, not a ramp lookup", () => {
    const theme = derive({ borderColor: "match-card" });
    expect(theme.light["divider-color"]).toBe(`${theme.light["card-background-color"]}1f`);
    expect(theme.dark["divider-color"]).toBe(`${theme.dark["card-background-color"]}1f`);
    expect(theme.light["outline-hover-color"]).toBe(`${theme.light["card-background-color"]}3d`);
    expect(theme.dark["outline-hover-color"]).toBe(`${theme.dark["card-background-color"]}3d`);
  });

  it("does not equal a naive mirrorSlot of the light card's own slot", () => {
    // Default config: cardBackground "neutral-100". A per-slot mirror of that
    // raw slot number (100 - 100 = 0, pure black) is nowhere near the actual
    // dark card `surfaces()` computes — proof the resolution must reuse the
    // real per-mode card value rather than mirroring the light choice.
    const theme = derive({ borderColor: "match-card" });
    expect(theme.dark["card-background-color"]).not.toBe("#000000");
    expect(theme.dark["card-background-color"]).toBe(getNeutralRamp("ha").ramp[10]); // #202020
  });

  it("composites away to exactly the card colour (the Invisible step)", () => {
    // α·C + (1-α)·C = C for any α — withAlpha's "1f" needs no special case.
    const theme = derive({ borderColor: "match-card" });
    for (const mode of ["light", "dark"] as const) {
      expect(theme[mode]["divider-color"].slice(0, 7)).toBe(theme[mode]["card-background-color"]);
    }
  });
});

describe("derive — shadow colour is decoupled from the border knob", () => {
  it("stays fixed at neutral-05 across the whole borderColor range, including match-card", () => {
    const neutral05 = getNeutralRamp("ha").ramp[5];
    const wholeRange = [
      "neutral-00",
      "neutral-05",
      "neutral-10",
      "neutral-20",
      "neutral-30",
      "neutral-40",
      "neutral-50",
      "neutral-60",
      "neutral-70",
      "neutral-80",
      "neutral-90",
      "neutral-95",
      "neutral-100",
      "match-card",
    ] as const;
    for (const borderColor of wholeRange) {
      const theme = derive({ borderColor });
      expect(theme.light["shadow-color"], borderColor).toBe(withAlpha(neutral05, "29"));
      expect(theme.dark["shadow-color"], borderColor).toBe(withAlpha(neutral05, "7a"));
    }
  });

  it("differs from divider-color once the border knob moves off neutral-05", () => {
    const theme = derive({ borderColor: "neutral-90" });
    expect(theme.light["shadow-color"].slice(0, 7)).not.toBe(
      theme.light["divider-color"].slice(0, 7),
    );
  });

  it("survives the match-card border without vanishing (card-on-card)", () => {
    const theme = derive({ borderColor: "match-card" });
    expect(theme.light["shadow-color"].slice(0, 7)).not.toBe(
      theme.light["card-background-color"],
    );
    expect(theme.dark["shadow-color"].slice(0, 7)).not.toBe(theme.dark["card-background-color"]);
  });
});

describe("derive — light and dark", () => {
  const theme = derive();

  it("separates mode-independent variables from mode-specific ones", () => {
    // Nothing may appear in both buckets, or the YAML would say it twice.
    for (const key of Object.keys(theme.light)) {
      expect(theme.common, key).not.toHaveProperty(key);
    }
    expect(Object.keys(theme.light).sort()).toEqual(Object.keys(theme.dark).sort());
  });

  it("reproduces HA's own dark defaults closely", () => {
    // HA ships #1c1c1c / #111111 / #282828 (analysis §2.3). We land on the
    // nearest values the chosen neutral ramp can express.
    expect(theme.dark["card-background-color"]).toBe("#202020"); // ~#1c1c1c
    expect(theme.dark["primary-background-color"]).toBe("#141414"); // ~#111111
    expect(theme.dark["secondary-background-color"]).toBe("#363636"); // ~#282828
    expect(theme.dark["primary-text-color"]).toBe("#ffffff");
  });

  it("preserves card-over-page elevation in dark mode for every knob combination", () => {
    // Deriving the two surfaces independently used to invert this pairing:
    // a neutral-95 card on a neutral-90 page came out with the dark card
    // *below* the dark page.
    const options = ["neutral-100", "neutral-95", "neutral-90", "neutral-80"] as const;
    const value = (hex: string) => Number.parseInt(hex.slice(1), 16);
    for (const cardBackground of options) {
      for (const primaryBackground of options) {
        if (cardBackground === primaryBackground) continue;
        const t = derive({ cardBackground, primaryBackground });
        const label = `${cardBackground} card on ${primaryBackground} page`;
        const lightSign = Math.sign(
          value(t.light["card-background-color"]) - value(t.light["primary-background-color"]),
        );
        const darkSign = Math.sign(
          value(t.dark["card-background-color"]) - value(t.dark["primary-background-color"]),
        );
        expect(darkSign, label).toBe(lightSign);
      }
    }
  });

  it("never collapses two distinct light-mode choices onto the same dark slot", () => {
    // The anchor-and-derive rule only ever *adds* index steps from the
    // anchor, so a real gap in light mode should survive as a real gap in
    // dark mode too, for every pair the current SurfaceChoice union allows.
    const options = ["neutral-100", "neutral-95", "neutral-90", "neutral-80"] as const;
    for (const cardBackground of options) {
      for (const primaryBackground of options) {
        if (cardBackground === primaryBackground) continue;
        const t = derive({ cardBackground, primaryBackground });
        const label = `${cardBackground} card on ${primaryBackground} page`;
        expect(t.dark["card-background-color"], label).not.toBe(
          t.dark["primary-background-color"],
        );
      }
    }
  });

  it("mirrors both surfaces to the same slot when the light-mode choice is equal", () => {
    // Card and page on the same slot is a legal, if unusual, config. The gap
    // is zero, so both surfaces mirror independently to the same anchor —
    // "collapse" here is the deliberate equal-input case, not the boundary
    // clamp (which today's four SurfaceChoice values never reach).
    const t = derive({ cardBackground: "neutral-90", primaryBackground: "neutral-90" });
    expect(t.light["card-background-color"]).toBe(t.light["primary-background-color"]);
    expect(t.dark["card-background-color"]).toBe(t.dark["primary-background-color"]);
    // neutral-90 is index 10 of 13; mirror is index (13 - 1 - 10) = 2 = neutral-10.
    expect(t.dark["card-background-color"]).toBe(getNeutralRamp("ha").ramp[10]);
  });

  it("computes the widest gap the current SurfaceChoice union can produce", () => {
    // neutral-80 (index 9) and neutral-100 (index 12): the widest gap (3)
    // any pair of today's four choices can express. Hand-computed against
    // the anchor-and-derive rule: darker mirrors to index (12 - 9) = 3
    // (neutral-20), the other sits `gap` steps further, at index 6
    // (neutral-50). Both land well inside the valid 0..12 index range, which
    // is what "the clamp never fires for today's choices" means concretely.
    const ha = getNeutralRamp("ha").ramp;
    const cardDarker = derive({ cardBackground: "neutral-80", primaryBackground: "neutral-100" });
    expect(cardDarker.dark["card-background-color"]).toBe(ha[20]);
    expect(cardDarker.dark["primary-background-color"]).toBe(ha[50]);

    const pageDarker = derive({ cardBackground: "neutral-100", primaryBackground: "neutral-80" });
    expect(pageDarker.dark["primary-background-color"]).toBe(ha[20]);
    expect(pageDarker.dark["card-background-color"]).toBe(ha[50]);
  });

  it("clamps to the ramp's own ends instead of escaping it — the boundary itself", () => {
    // `neutralRampAt` is the exact function `surfaces()` reads every dark-mode
    // slot through. Today's four SurfaceChoice values never push an index
    // past 0..12 (previous test), so this exercises the clamp directly,
    // module-only (not part of the frozen public API — see its doc comment).
    const ha = getNeutralRamp("ha").ramp;
    expect(neutralRampAt(ha, -1)).toBe(ha[0]); // one past the dark end
    expect(neutralRampAt(ha, -50)).toBe(ha[0]); // arbitrarily far past it
    expect(neutralRampAt(ha, 12)).toBe(ha[100]); // the light end itself
    expect(neutralRampAt(ha, 13)).toBe(ha[100]); // one past the light end
    expect(neutralRampAt(ha, 50)).toBe(ha[100]); // arbitrarily far past it
  });

  it("keeps the secondary background distinct from the card and the page", () => {
    const options = ["neutral-100", "neutral-95", "neutral-90", "neutral-80"] as const;
    for (const cardBackground of options) {
      for (const primaryBackground of options) {
        const t = derive({ cardBackground, primaryBackground });
        for (const mode of ["light", "dark"] as const) {
          const label = `${mode}: ${cardBackground}/${primaryBackground}`;
          expect(t[mode]["secondary-background-color"], label).not.toBe(
            t[mode]["primary-background-color"],
          );
          if (cardBackground !== primaryBackground) {
            expect(t[mode]["secondary-background-color"], label).not.toBe(
              t[mode]["card-background-color"],
            );
          }
        }
      }
    }
  });

  it("keeps shadows dark in dark mode, only raising their opacity", () => {
    // A shadow is an absence of light; it must not invert with the divider.
    const base = getNeutralRamp("ha").ramp[5].slice(1);
    expect(theme.dark["ha-box-shadow-s"]).toContain(base);
    expect(theme.dark["shadow-color"].startsWith(`#${base}`)).toBe(true);
    const alpha = (v: string) => Number.parseInt(v.slice(7, 9), 16);
    expect(alpha(theme.dark["shadow-color"])).toBeGreaterThan(alpha(theme.light["shadow-color"]));
  });

  it("flips dividers and input ink to the light end of the ramp in dark mode", () => {
    const ramp = getNeutralRamp("ha").ramp;
    expect(theme.dark["divider-color"]).toBe(`${ramp[95]}1f`);
    expect(theme.dark["input-ink-color"]).toBe(`${ramp[95]}de`);
    expect(theme.light["input-ink-color"]).toBe(`${ramp[5]}de`);
  });

  it("raises input fills above the card in dark mode and recesses them in light", () => {
    const value = (hex: string) => Number.parseInt(hex.slice(1), 16);
    expect(value(theme.light["input-fill-color"])).toBeLessThan(
      value(theme.light["card-background-color"]),
    );
    expect(value(theme.dark["input-fill-color"])).toBeGreaterThan(
      value(theme.dark["card-background-color"]),
    );
  });

  it("keeps body text readable against its own background in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      const vars = modeVars(theme, mode);
      const ratio = contrast(vars["primary-text-color"], vars["card-background-color"]);
      expect(ratio, `${mode} primary text`).toBeGreaterThan(7);
      const secondary = contrast(vars["secondary-text-color"], vars["card-background-color"]);
      expect(secondary, `${mode} secondary text`).toBeGreaterThan(4.5);
    }
  });

  it("lifts the entity icon colour off the dark end of the primary ramp in dark mode", () => {
    expect(theme.light["state-icon-color"]).toBe(theme.common["ha-color-primary-30"]);
    expect(theme.dark["state-icon-color"]).toBe(theme.common["ha-color-primary-70"]);
  });
});

function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const v = normalizeHex(hex);
    const ch = [1, 3, 5].map((i) => {
      const c = Number.parseInt(v.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

describe("output shapes", () => {
  it("merges a full map for one mode", () => {
    const theme = derive();
    const light = modeVars(theme, "light");
    expect(Object.keys(light).length).toBe(
      Object.keys(theme.common).length + Object.keys(theme.light).length,
    );
    expect(light["primary-color"]).toBe(theme.common["primary-color"]);
    expect(light["card-background-color"]).toBe(theme.light["card-background-color"]);
  });

  it("prefixes CSS custom properties for the preview containers", () => {
    const props = toCssProperties(derive(), "dark");
    expect(props["--primary-color"]).toBe("#009ac7");
    expect(props["--card-background-color"]).toBe("#202020");
    for (const key of Object.keys(props)) expect(key.startsWith("--")).toBe(true);
  });

  it("exposes the generated ramps for the preview", () => {
    const theme = derive({ colors: { primary: "#7c5cff" }, neutralRamp: "olive" });
    expect(theme.ramps.primary[KNOB_SLOT.primary]).toBe("#7c5cff");
    // `ramps.neutral` stays the 11-shade `Ramp` the DerivedTheme type
    // promises — the preset itself now ships 13 (see `NeutralRampSlot`), but
    // 00/100 are neutral-only and not part of this shared output shape.
    const olive = getNeutralRamp("olive").ramp;
    expect(theme.ramps.neutral).toEqual(
      Object.fromEntries(RAMP_SLOTS.map((s) => [s, olive[s]])),
    );
    expect(Object.keys(theme.ramps.neutral).map(Number).sort((a, b) => a - b)).toEqual([
      ...RAMP_SLOTS,
    ]);
    expect(Object.keys(theme.ramps.red).map(Number).sort((a, b) => a - b)).toEqual([
      ...RAMP_SLOTS,
    ]);
  });

  it("echoes the resolved config back", () => {
    const theme = derive({ name: "Ocean" });
    expect(theme.config.name).toBe("Ocean");
    expect(theme.config.colors.primary).toBe(DEFAULT_CONFIG.colors.primary);
  });
});
