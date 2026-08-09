import { describe, expect, it } from "vitest";

import {
  alphaOf,
  hexToOklch,
  hexToRgb,
  isHex,
  normalizeHex,
  oklchToHex,
  opaqueHex,
  rgbToHex,
  rgbTriplet,
  withAlpha,
} from "../color.ts";

describe("normalizeHex", () => {
  it("expands and lowercases every accepted spelling", () => {
    expect(normalizeHex("#ccc")).toBe("#cccccc");
    expect(normalizeHex("#CCC")).toBe("#cccccc");
    expect(normalizeHex("#0003")).toBe("#00000033");
    expect(normalizeHex("#00A5FF")).toBe("#00a5ff");
    expect(normalizeHex("00a5ff")).toBe("#00a5ff");
    expect(normalizeHex("  #00a5ff  ")).toBe("#00a5ff");
    expect(normalizeHex("#1414141f")).toBe("#1414141f");
  });

  it("rejects anything that is not a hex colour", () => {
    for (const bad of ["", "#", "#12", "#12345", "rgb(0,0,0)", "red", "#gggggg", "#1234567"]) {
      expect(() => normalizeHex(bad), bad).toThrow(TypeError);
    }
  });

  it("agrees with isHex", () => {
    expect(isHex("#abc")).toBe(true);
    expect(isHex("nope")).toBe(false);
  });
});

describe("channel conversions", () => {
  it("round-trips every 8-bit grey through rgb", () => {
    for (let v = 0; v < 256; v++) {
      const hex = rgbToHex({ r: v, g: v, b: v });
      expect(hexToRgb(hex)).toEqual({ r: v, g: v, b: v });
    }
  });

  it("clamps out-of-range channels rather than wrapping", () => {
    expect(rgbToHex({ r: -20, g: 300, b: 128 })).toBe("#00ff80");
  });

  it("formats rgb companions the way HA spells them", () => {
    expect(rgbTriplet("#009ac7")).toBe("0, 154, 199");
    expect(rgbTriplet("#fff")).toBe("255, 255, 255");
  });

  it("ignores alpha when reading a triplet", () => {
    expect(rgbTriplet("#1414141f")).toBe("20, 20, 20");
  });
});

describe("alpha helpers", () => {
  it("appends a two-digit alpha from a hex string", () => {
    expect(withAlpha("#141414", "1f")).toBe("#1414141f");
    expect(withAlpha("#141414", "3d")).toBe("#1414143d");
  });

  it("appends an alpha from a 0..1 fraction", () => {
    expect(withAlpha("#000000", 0)).toBe("#00000000");
    expect(withAlpha("#000000", 1)).toBe("#000000ff");
    expect(withAlpha("#000000", 0.12)).toBe("#0000001f");
    expect(withAlpha("#000000", 0.48)).toBe("#0000007a");
  });

  it("replaces an existing alpha rather than stacking one", () => {
    expect(withAlpha("#1414141f", "3d")).toBe("#1414143d");
  });

  it("rejects a malformed alpha", () => {
    expect(() => withAlpha("#141414", "zz")).toThrow(TypeError);
  });

  it("reads alpha back out", () => {
    expect(alphaOf("#141414")).toBe(1);
    expect(alphaOf("#1414141f")).toBeCloseTo(0.1216, 4);
    expect(opaqueHex("#1414141f")).toBe("#141414");
  });
});

describe("OKLCH", () => {
  it("round-trips hex → oklch → hex exactly for the HA ramps", () => {
    const samples = [
      "#001721",
      "#009ac7",
      "#eff9fe",
      "#dc3146",
      "#ff9342",
      "#00ac49",
      "#141414",
      "#f3f3f3",
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
    ];
    for (const hex of samples) {
      expect(oklchToHex(hexToOklch(hex)), hex).toBe(hex);
    }
  });

  it("round-trips a large random sample exactly", () => {
    // Deterministic LCG so a failure is reproducible.
    let seed = 0x2545f491;
    const next = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed;
    };
    for (let i = 0; i < 2000; i++) {
      const hex = rgbToHex({ r: next() % 256, g: next() % 256, b: next() % 256 });
      expect(oklchToHex(hexToOklch(hex)), hex).toBe(hex);
    }
  });

  it("reports achromatic colours with zero chroma", () => {
    expect(hexToOklch("#000000").c).toBeCloseTo(0, 6);
    expect(hexToOklch("#ffffff").c).toBeCloseTo(0, 6);
    expect(hexToOklch("#7a7a7a").c).toBeCloseTo(0, 6);
    expect(hexToOklch("#000000").l).toBeCloseTo(0, 6);
    expect(hexToOklch("#ffffff").l).toBeCloseTo(1, 6);
  });

  it("gamut-maps an impossible chroma back into sRGB instead of clipping to black", () => {
    const mapped = oklchToHex({ l: 0.6, c: 0.9, h: 150 });
    expect(isHex(mapped)).toBe(true);
    const back = hexToOklch(mapped);
    // Lightness and hue are preserved; only chroma is given up.
    expect(back.l).toBeCloseTo(0.6, 1);
    expect(back.c).toBeLessThan(0.9);
    expect(back.c).toBeGreaterThan(0.05);
  });

  it("clamps lightness outside 0..1", () => {
    expect(oklchToHex({ l: -1, c: 0, h: 0 })).toBe("#000000");
    expect(oklchToHex({ l: 2, c: 0, h: 0 })).toBe("#ffffff");
  });

  it("normalises hue outside 0..360", () => {
    expect(oklchToHex({ l: 0.6, c: 0.1, h: 390 })).toBe(
      oklchToHex({ l: 0.6, c: 0.1, h: 30 }),
    );
    expect(oklchToHex({ l: 0.6, c: 0.1, h: -330 })).toBe(
      oklchToHex({ l: 0.6, c: 0.1, h: 30 }),
    );
  });
});
