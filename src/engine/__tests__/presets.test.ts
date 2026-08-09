/**
 * Verifies the committed preset data is a faithful transcription of the
 * read-only reference pages, by re-parsing those pages here and diffing.
 *
 * This is what stops a hand edit — or a bad re-run of
 * `scripts/extract-presets.mjs` — from silently changing a hex code.
 */
import { describe, expect, it } from "vitest";

// Imported through Vite's `?raw` loader — see template-css.ts.
import neutralRampsPage from "../../../.references/colors/black-white-ramps.html?raw";
import palettesPage from "../../../.references/colors/ha-color-palettes.html?raw";
import { isHex, normalizeHex } from "../color.ts";
import {
  EXTENDED_PALETTES,
  FONTS,
  getExtendedPalette,
  getFont,
  getNeutralRamp,
  NEUTRAL_RAMPS,
  PALETTE_COLOR_NAMES,
} from "../presets/index.ts";
import {
  HA_GREEN_RAMP,
  HA_ORANGE_RAMP,
  HA_PRIMARY_RAMP,
  HA_RED_RAMP,
} from "../presets/reference-ramps.ts";
import { RAMP_SLOTS } from "../types.ts";
import { parseTemplateCss } from "./template-css.ts";

/** Same two structures `scripts/extract-presets.mjs` reads, parsed independently. */
function parseTable(html: string) {
  const rowsMatch = /const rows = (\[[\s\S]*?\n\]);/.exec(html);
  if (!rowsMatch) throw new Error("no rows literal");
  // The literal is JSON apart from its trailing commas.
  const rows = JSON.parse(rowsMatch[1].replace(/,(\s*[\]}])/g, "$1")) as string[][];

  const headerMatch = /<tr id="headerRow">([\s\S]*?)<\/tr>/.exec(html);
  if (!headerMatch) throw new Error("no header row");
  const header = [...headerMatch[1].matchAll(/<th data-col="(\d+)">([^<]+)<\/th>/g)].map(
    (m) => ({ col: Number(m[1]), label: m[2].trim() }),
  );

  return { rows, header };
}

const stripMarker = (v: string) => (v.endsWith("•") ? v.slice(0, -1) : v).toLowerCase();

describe("neutral ramp presets", () => {
  const { rows, header } = parseTable(neutralRampsPage);

  it("ships every preset the reference page defines, and no extras", () => {
    expect(NEUTRAL_RAMPS.map((r) => r.label)).toEqual(header.map((h) => h.label));
    expect(NEUTRAL_RAMPS).toHaveLength(10);
  });

  it("transcribes every shade exactly", () => {
    const slotRows = rows.filter(([name]) => name.startsWith("neutral-"));
    expect(slotRows).toHaveLength(RAMP_SLOTS.length);

    for (const [i, { col, label }] of header.entries()) {
      const preset = NEUTRAL_RAMPS[i];
      expect(preset.label).toBe(label);
      slotRows.forEach((row, r) => {
        const slot = RAMP_SLOTS[r];
        expect(`${label} ${slot}`).toBe(`${label} ${slot}`);
        expect(preset.ramp[slot], `${label} neutral-${slot}`).toBe(stripMarker(row[col + 1]));
      });
    }
  });

  it("matches template.css for the Home Assistant ramp", () => {
    const template = parseTemplateCss();
    for (const slot of RAMP_SLOTS) {
      const key = `ha-color-neutral-${String(slot).padStart(2, "0")}`;
      expect(getNeutralRamp("ha").ramp[slot], key).toBe(normalizeHex(template[key]));
    }
  });

  it("has monotonically lightening ramps", () => {
    for (const preset of NEUTRAL_RAMPS) {
      const values = RAMP_SLOTS.map((s) => Number.parseInt(preset.ramp[s].slice(1), 16));
      for (let i = 1; i < values.length; i++) {
        expect(values[i], `${preset.label} slot ${RAMP_SLOTS[i]}`).toBeGreaterThan(values[i - 1]);
      }
    }
  });
});

describe("extended palette presets", () => {
  const { rows, header } = parseTable(palettesPage);

  it("ships every preset the reference page defines, and no extras", () => {
    expect(EXTENDED_PALETTES.map((p) => p.label)).toEqual(header.map((h) => h.label));
    expect(EXTENDED_PALETTES).toHaveLength(8);
  });

  it("keeps the reference page's 18 colour names, in order", () => {
    expect([...PALETTE_COLOR_NAMES]).toEqual(rows.map(([name]) => name));
    expect(PALETTE_COLOR_NAMES).toHaveLength(18);
  });

  it("transcribes every colour exactly, ignoring the derived-swatch marker", () => {
    for (const [i, { col, label }] of header.entries()) {
      const preset = EXTENDED_PALETTES[i];
      expect(preset.label).toBe(label);
      for (const row of rows) {
        const name = row[0] as (typeof PALETTE_COLOR_NAMES)[number];
        expect(preset.colors[name], `${label} ${name}`).toBe(stripMarker(row[col + 1]));
      }
    }
  });

  it("matches template.css for the Home Assistant palette", () => {
    const template = parseTemplateCss();
    for (const name of PALETTE_COLOR_NAMES) {
      expect(getExtendedPalette("ha").colors[name], `${name}-color`).toBe(
        normalizeHex(template[`${name}-color`]),
      );
    }
  });

  it("has a valid opaque hex in every cell", () => {
    for (const preset of EXTENDED_PALETTES) {
      for (const name of PALETTE_COLOR_NAMES) {
        expect(preset.colors[name], `${preset.label} ${name}`).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});

describe("HA reference hue ramps", () => {
  it("matches template.css shade for shade", () => {
    const template = parseTemplateCss();
    const families = [
      ["primary", HA_PRIMARY_RAMP],
      ["orange", HA_ORANGE_RAMP],
      ["red", HA_RED_RAMP],
      ["green", HA_GREEN_RAMP],
    ] as const;
    for (const [name, ramp] of families) {
      for (const slot of RAMP_SLOTS) {
        const key = `ha-color-${name}-${String(slot).padStart(2, "0")}`;
        expect(ramp[slot], key).toBe(normalizeHex(template[key]));
      }
    }
  });
});

describe("fonts", () => {
  it("ships exactly the approved shortlist", () => {
    const byCategory = (c: string) => FONTS.filter((f) => f.category === c).map((f) => f.label);
    expect(byCategory("sans")).toEqual([
      "Roboto",
      "Inter",
      "Figtree",
      "DM Sans",
      "Nunito Sans",
      "Manrope",
      "Outfit",
      "Rubik",
    ]);
    expect(byCategory("serif")).toEqual(["Source Serif 4", "Lora", "Merriweather", "Bitter"]);
    expect(byCategory("display-serif")).toEqual(["Fraunces", "Playfair Display"]);
    expect(byCategory("mono")).toEqual(["JetBrains Mono", "IBM Plex Mono"]);
    expect(byCategory("system")).toEqual(["System sans", "System serif", "System mono"]);
    expect(FONTS).toHaveLength(19);
  });

  it("marks exactly the faces Home Assistant does not ship as needing a loader", () => {
    const loaded = FONTS.filter((f) => f.needsWebfont).map((f) => f.id);
    expect(loaded).not.toContain("roboto");
    expect(loaded).not.toContain("system-sans");
    expect(loaded).not.toContain("system-serif");
    expect(loaded).not.toContain("system-mono");
    expect(loaded).toHaveLength(15);
    for (const font of FONTS) {
      expect(Boolean(font.googleFontsFamily), font.id).toBe(font.needsWebfont);
    }
  });

  it("reproduces HA's own defaults verbatim", () => {
    const template = parseTemplateCss();
    expect(getFont("roboto").stack).toBe(template["ha-font-family-body"]);
    expect(getFont("system-mono").stack).toBe(template["ha-font-family-code"]);
    expect(getFont("system-sans").stack).toBe(template["ha-font-family-longform"]);
  });

  it("quotes multi-word families and always names a fallback", () => {
    for (const font of FONTS) {
      if (font.needsWebfont) {
        expect(font.stack, font.id).toContain(`"${font.label}"`);
        expect(font.stack.split(",").length, font.id).toBeGreaterThan(1);
      }
      expect(font.stack.trim()).not.toBe("");
    }
  });

  it("has unique ids and looks up by id", () => {
    expect(new Set(FONTS.map((f) => f.id)).size).toBe(FONTS.length);
    expect(getFont("lora").label).toBe("Lora");
    expect(() => getFont("comic-sans")).toThrow(RangeError);
  });
});

describe("preset lookups", () => {
  it("throws on an unknown id rather than returning undefined", () => {
    // @ts-expect-error deliberately invalid id
    expect(() => getNeutralRamp("nope")).toThrow(RangeError);
    // @ts-expect-error deliberately invalid id
    expect(() => getExtendedPalette("nope")).toThrow(RangeError);
  });

  it("has unique preset ids", () => {
    expect(new Set(NEUTRAL_RAMPS.map((p) => p.id)).size).toBe(NEUTRAL_RAMPS.length);
    expect(new Set(EXTENDED_PALETTES.map((p) => p.id)).size).toBe(EXTENDED_PALETTES.length);
  });

  it("stores every value as a normalised lowercase hex", () => {
    for (const preset of NEUTRAL_RAMPS) {
      for (const slot of RAMP_SLOTS) {
        expect(isHex(preset.ramp[slot])).toBe(true);
        expect(preset.ramp[slot]).toBe(normalizeHex(preset.ramp[slot]));
      }
    }
  });
});
