import { describe, expect, it } from "vitest"

import { parseHexFieldInput } from "./hex-field"

describe("parseHexFieldInput", () => {
  it("accepts a 6-digit hex, with or without a leading #", () => {
    expect(parseHexFieldInput("#009ac7")).toBe("#009ac7")
    expect(parseHexFieldInput("009ac7")).toBe("#009ac7")
  })

  it("accepts a 3-digit hex and expands it", () => {
    expect(parseHexFieldInput("#abc")).toBe("#aabbcc")
    expect(parseHexFieldInput("abc")).toBe("#aabbcc")
  })

  it("is case-insensitive and normalizes to lowercase", () => {
    expect(parseHexFieldInput("#ABC")).toBe("#aabbcc")
    expect(parseHexFieldInput("009AC7")).toBe("#009ac7")
  })

  it("trims surrounding whitespace", () => {
    expect(parseHexFieldInput("  #009ac7  ")).toBe("#009ac7")
  })

  it("rejects a 4-digit hex, unlike the engine's own isHex", () => {
    expect(parseHexFieldInput("#009a")).toBeNull()
  })

  it("rejects an 8-digit hex — this field never carries alpha", () => {
    expect(parseHexFieldInput("#009ac7ff")).toBeNull()
  })

  it("rejects garbage", () => {
    expect(parseHexFieldInput("not a color")).toBeNull()
    expect(parseHexFieldInput("")).toBeNull()
    expect(parseHexFieldInput("#12345")).toBeNull()
  })
})
