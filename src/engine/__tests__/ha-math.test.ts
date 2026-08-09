import { describe, expect, it } from "vitest";

import { rgbToHex } from "../color.ts";
import {
  brighten,
  contrastingText,
  contrastRatio,
  darken,
  HA_CONTRAST_THRESHOLD,
  lab2rgb,
  labBrighten,
  labDarken,
  luminosity,
  rgb2lab,
  rgbContrast,
} from "../ha-math.ts";

describe("rgb2lab", () => {
  it("matches the published CIE L*a*b* D65 values for the sRGB primaries", () => {
    const cases: [readonly [number, number, number], [number, number, number]][] = [
      [[255, 0, 0], [53.24, 80.09, 67.2]],
      [[0, 255, 0], [87.73, -86.18, 83.18]],
      [[0, 0, 255], [32.3, 79.19, -107.86]],
      [[255, 255, 255], [100, 0, 0]],
      [[0, 0, 0], [0, 0, 0]],
    ];
    for (const [rgb, expected] of cases) {
      const lab = rgb2lab(rgb);
      expect(lab[0], `L of ${rgb.join(",")}`).toBeCloseTo(expected[0], 1);
      expect(lab[1], `a of ${rgb.join(",")}`).toBeCloseTo(expected[1], 1);
      expect(lab[2], `b of ${rgb.join(",")}`).toBeCloseTo(expected[2], 1);
    }
  });

  it("never reports negative lightness", () => {
    expect(rgb2lab([0, 0, 0])[0]).toBe(0);
  });

  it("round-trips through lab2rgb within a rounding step", () => {
    const samples: [number, number, number][] = [
      [0, 154, 199],
      [220, 49, 70],
      [255, 147, 66],
      [0, 172, 73],
      [20, 20, 20],
      [243, 243, 243],
      [0, 0, 0],
      [255, 255, 255],
    ];
    for (const rgb of samples) {
      const back = lab2rgb(rgb2lab(rgb)).map(Math.round);
      expect(back, rgb.join(",")).toEqual(rgb);
    }
  });

  it("clamps lab2rgb output into 0..255 instead of wrapping", () => {
    const [r, g, b] = lab2rgb([200, 0, 0]);
    for (const v of [r, g, b]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
    }
    expect(rgbToHex({ r, g, b })).toBe("#ffffff");
  });
});

describe("labBrighten / labDarken", () => {
  it("shifts L* by exactly HA's Kn = 18 per step, leaving a and b alone", () => {
    const lab = rgb2lab([0, 154, 199]);
    expect(labBrighten(lab)[0]).toBeCloseTo(lab[0] + 18, 10);
    expect(labBrighten(lab, 2)[0]).toBeCloseTo(lab[0] + 36, 10);
    expect(labDarken(lab)[0]).toBeCloseTo(lab[0] - 18, 10);
    expect(labDarken(lab, 2)[0]).toBeCloseTo(lab[0] - 36, 10);
    for (const out of [labBrighten(lab), labDarken(lab, 2)]) {
      expect(out[1]).toBe(lab[1]);
      expect(out[2]).toBe(lab[2]);
    }
  });

  it("darken and brighten are inverse operations", () => {
    const lab = rgb2lab([220, 49, 70]);
    expect(labDarken(labBrighten(lab))).toEqual(lab);
  });

  it("brightens and darkens hex colours monotonically", () => {
    const seed = "#009ac7";
    const lighter = brighten(seed);
    const darker = darken(seed);
    expect(luminosity(rgbOf(lighter))).toBeGreaterThan(luminosity(rgbOf(seed)));
    expect(luminosity(rgbOf(darker))).toBeLessThan(luminosity(rgbOf(seed)));
  });

  it("saturates rather than overflowing at the ends", () => {
    expect(brighten("#ffffff", 5)).toBe("#ffffff");
    expect(darken("#000000", 5)).toBe("#000000");
  });
});

function rgbOf(hex: string): [number, number, number] {
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16),
  ];
}

describe("luminosity / rgbContrast", () => {
  it("matches WCAG reference luminances", () => {
    expect(luminosity([255, 255, 255])).toBeCloseTo(1, 10);
    expect(luminosity([0, 0, 0])).toBeCloseTo(0, 10);
    expect(luminosity([128, 128, 128])).toBeCloseTo(0.2159, 4);
  });

  it("gives 21:1 for black on white and 1:1 for a colour on itself", () => {
    expect(rgbContrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 6);
    expect(rgbContrast([0, 154, 199], [0, 154, 199])).toBeCloseTo(1, 10);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#009ac7", "#212121")).toBeCloseTo(
      contrastRatio("#212121", "#009ac7"),
      10,
    );
  });

  it("puts #767676 on white right at the 4.5:1 AA boundary", () => {
    // The canonical "smallest AA-passing grey on white" from the WCAG docs.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#777777", "#ffffff")).toBeLessThan(4.5);
  });
});

describe("contrastingText — HA's on-colour text rule", () => {
  it("uses a threshold of 6, not the 4.5 that §7.5 quotes in prose", () => {
    // HA's default primary scores between the two thresholds, and HA ships
    // #ffffff for --text-primary-color. Only the 6 produces that, which is what
    // pins the constant down.
    const ratio = contrastRatio("#009ac7", "#212121");
    expect(ratio).toBeGreaterThan(4.5);
    expect(ratio).toBeLessThan(HA_CONTRAST_THRESHOLD);
    expect(contrastingText("#009ac7")).toBe("#ffffff");
  });

  it("reproduces HA's shipped defaults for the primary family", () => {
    // --text-primary-color, from --primary-color #009ac7
    expect(contrastingText("#009ac7")).toBe("#ffffff");
    // --text-light-primary-color, from --light-primary-color #18bcf2
    expect(contrastingText("#18bcf2")).toBe("#212121");
  });

  it("picks dark ink on the default accent", () => {
    expect(contrastingText("#ff9800")).toBe("#212121");
  });

  it("handles the extremes", () => {
    expect(contrastingText("#000000")).toBe("#ffffff");
    expect(contrastingText("#ffffff")).toBe("#212121");
    expect(contrastingText("#212121")).toBe("#ffffff");
  });

  it("switches exactly at the threshold", () => {
    // Walk the greyscale and find the flip point, then assert it is where the
    // 6:1 rule puts it rather than where a 4.5:1 rule would.
    let flip = -1;
    for (let v = 0; v < 256; v++) {
      const hex = rgbToHex({ r: v, g: v, b: v });
      if (contrastingText(hex) === "#212121") {
        flip = v;
        break;
      }
    }
    expect(flip).toBeGreaterThan(0);
    const at = rgbToHex({ r: flip, g: flip, b: flip });
    const below = rgbToHex({ r: flip - 1, g: flip - 1, b: flip - 1 });
    expect(contrastRatio(at, "#212121")).toBeGreaterThanOrEqual(HA_CONTRAST_THRESHOLD);
    expect(contrastRatio(below, "#212121")).toBeLessThan(HA_CONTRAST_THRESHOLD);
  });
});
