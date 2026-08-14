// Smoke test for the M2 wireframe (`docs/wireframe/index.html`).
//
// The wireframe is a single self-contained HTML file with no build step (UX-SPEC.md
// header). It stays that way — this test does not import it as a module. It loads the
// real file into its own `jsdom` document with `runScripts: "dangerously"` so the
// inline <script> actually executes, then drives the DOM the way a user would: click,
// type, press keys. This is not exercised by the app's own React test suite, since the
// wireframe never becomes app code.
//
// Re-run after any wireframe edit, and especially after a knob is added, removed or
// rewired — the font-knob cut (UX-SPEC §3.2, §7.3) is what these tests were written to
// catch a regression on.

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { JSDOM } from "jsdom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const html = readFileSync(join(here, "index.html"), "utf-8")

let dom: JSDOM
let document: Document
let window: JSDOM["window"]

function press(el: Element, key: string) {
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true }))
}

function click(el: Element | null) {
  if (!el) throw new Error("click target not found")
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }))
}

beforeEach(() => {
  // A fresh DOM per test — the wireframe's top-level `const`s would collide across a
  // shared document, and each test wants its own clean `localStorage`.
  dom = new JSDOM(html, {
    runScripts: "dangerously",
    url: "http://localhost/wireframe/",
    pretendToBeVisual: true,
  })
  window = dom.window
  document = window.document
})

afterEach(() => {
  dom.window.close()
})

describe("wireframe: loads", () => {
  it("executes the inline script with no error and renders the shell", () => {
    expect(document.title).toMatch(/HA Theme Builder/)
    expect(document.querySelector(".sidebar")).toBeTruthy()
    expect(document.querySelector(".preview")).toBeTruthy()
  })
})

describe("wireframe: Typography — one knob, not four", () => {
  it("ships only the Body font family select", () => {
    expect(document.querySelector("#f-body")).toBeTruthy()
    expect(document.querySelector("#f-head")).toBeNull()
    expect(document.querySelector("#f-long")).toBeNull()
    expect(document.querySelector("#f-code")).toBeNull()
  })

  it("has no More/Less disclosure left to open", () => {
    expect(document.querySelector("#fontMoreBtn")).toBeNull()
    expect(document.querySelector("#fontMore")).toBeNull()
    expect(document.querySelector(".collapsible")).toBeNull()
  })

  it("builds the Body select from the 19-item, 5-group engine list, System last", () => {
    const select = document.querySelector<HTMLSelectElement>("#f-body")!
    const groups = Array.from(select.querySelectorAll("optgroup"))
    expect(groups.map((g) => g.label)).toEqual([
      "Sans-serif",
      "Serif",
      "Display serif",
      "Monospace",
      "System",
    ])
    expect(select.querySelectorAll("option")).toHaveLength(19)
    expect(select.value).toBe("Roboto")
  })
})

describe("wireframe: builder-chrome mode toggle (§1.1)", () => {
  it("defaults to Auto and never touches the preview panels", () => {
    const auto = document.querySelector('#modeToggle button[data-mode="auto"]')!
    expect(auto.getAttribute("aria-checked")).toBe("true")
    expect(document.documentElement.getAttribute("data-chrome")).toBe("light")
  })

  it("Dark sets aria-checked, data-chrome and persists to localStorage", () => {
    click(document.querySelector('#modeToggle button[data-mode="dark"]'))
    expect(document.querySelector('#modeToggle button[data-mode="dark"]')!.getAttribute("aria-checked")).toBe(
      "true",
    )
    expect(document.querySelector('#modeToggle button[data-mode="auto"]')!.getAttribute("aria-checked")).toBe(
      "false",
    )
    expect(document.documentElement.getAttribute("data-chrome")).toBe("dark")
    expect(window.localStorage.getItem("ha-theme-builder:color-scheme")).toBe("dark")
  })

  it("does not add or remove any theme CSS variable on the preview panels", () => {
    const before = document.querySelector(".panel.lt")!.getAttribute("style")
    click(document.querySelector('#modeToggle button[data-mode="dark"]'))
    const after = document.querySelector(".panel.lt")!.getAttribute("style")
    expect(after).toBe(before)
  })
})

describe("wireframe: color popover", () => {
  it("opens on the trigger, focuses the hex field, and shows the current value", () => {
    click(document.querySelector('.swatch-row[data-knob="primary"]'))
    expect(document.querySelector("#pop")!.classList.contains("open")).toBe(true)
    const hexField = document.querySelector<HTMLInputElement>("#popHex")!
    expect(hexField.value.toLowerCase()).toBe("#009ac7")
  })

  it("commits a typed hex on Enter and updates the trigger swatch", () => {
    const trigger = document.querySelector<HTMLButtonElement>('.swatch-row[data-knob="primary"]')!
    click(trigger)
    const hexField = document.querySelector<HTMLInputElement>("#popHex")!
    hexField.value = "#ff00ff"
    press(hexField, "Enter")
    expect(trigger.querySelector(".hx")!.textContent).toBe("#ff00ff")
  })

  it("rejects a malformed hex — the field reverts instead of committing", () => {
    const trigger = document.querySelector<HTMLButtonElement>('.swatch-row[data-knob="accent"]')!
    click(trigger)
    const before = trigger.querySelector(".hx")!.textContent
    const hexField = document.querySelector<HTMLInputElement>("#popHex")!
    hexField.value = "not-a-color"
    press(hexField, "Enter")
    expect(trigger.querySelector(".hx")!.textContent).toBe(before)
  })

  it("writes a Recent entry to localStorage on a hex-field commit", () => {
    click(document.querySelector('.swatch-row[data-knob="error"]'))
    const hexField = document.querySelector<HTMLInputElement>("#popHex")!
    hexField.value = "#123456"
    press(hexField, "Enter")
    const stored = JSON.parse(window.localStorage.getItem("ha-theme-builder:recent-colors") ?? "[]")
    expect(stored[0].hex).toBe("#123456")
  })

  it("closes on Escape and returns the swatch to unexpanded", () => {
    const trigger = document.querySelector<HTMLButtonElement>('.swatch-row[data-knob="success"]')!
    click(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    press(document, "Escape")
    expect(document.querySelector("#pop")!.classList.contains("open")).toBe(false)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
  })

  it("a palette swatch pick closes over the current entity-palette preset", () => {
    click(document.querySelector('.swatch-row[data-knob="warning"]'))
    const swatch = document.querySelector<HTMLButtonElement>("#popPal button")!
    click(swatch)
    expect(document.querySelector("#pop")!.classList.contains("open")).toBe(true)
  })
})

describe("wireframe: Base tone preset list (§3.3)", () => {
  it("selecting a ramp updates aria-checked and repaints the ramp preview swatches", () => {
    const items = () => document.querySelectorAll<HTMLButtonElement>("#rampList .preset-item")
    expect(items()[0].getAttribute("aria-checked")).toBe("true")
    const beforeFirstSwatch = document.querySelector("#rampPreview .st .c")!.getAttribute("style")
    click(items()[1]) // renderAll() rebuilds the list, so re-query after every click
    expect(items()[0].getAttribute("aria-checked")).toBe("false")
    expect(items()[1].getAttribute("aria-checked")).toBe("true")
    const afterFirstSwatch = document.querySelector("#rampPreview .st .c")!.getAttribute("style")
    expect(afterFirstSwatch).not.toBe(beforeFirstSwatch)
  })

  it("strips the ' (Tailwind)' suffix in the sidebar but not in the compare-all dialog", () => {
    const items = document.querySelectorAll("#rampList .preset-item .pi-nm")
    expect(items[2].textContent).toBe("Slate")
    click(document.querySelector("#btnCmpRamps"))
    const header = document.querySelectorAll("#cmpHead th")
    expect(header[3].textContent).toBe("Slate (Tailwind)")
  })
})

describe("wireframe: Surfaces group (§2.5)", () => {
  it("Card background is a 4-swatch row and picking one updates state", () => {
    const swatches = () => document.querySelectorAll<HTMLButtonElement>("#bgCard button")
    expect(swatches()).toHaveLength(4)
    expect(swatches()[3].getAttribute("aria-checked")).toBe("true") // Neutral 100, default
    click(swatches()[0]) // renderAll() rebuilds the row, so re-query after the click
    expect(swatches()[0].getAttribute("aria-checked")).toBe("true")
    expect(swatches()[3].getAttribute("aria-checked")).toBe("false")
  })

  it("Border color renders five named steps, Strong selected by default", () => {
    const rows = () => document.querySelectorAll<HTMLButtonElement>("#borderList .border-row")
    const byLabel = (label: string) =>
      Array.from(rows()).find((r) => r.querySelector(".pi-nm")?.textContent === label)!
    expect(rows()).toHaveLength(5)
    expect(byLabel("Strong").getAttribute("aria-checked")).toBe("true")
    click(byLabel("Invisible")) // renderAll() rebuilds the list, so re-query after the click
    expect(byLabel("Invisible").getAttribute("aria-checked")).toBe("true")
    expect(byLabel("Strong").getAttribute("aria-checked")).toBe("false")
  })
})

describe("wireframe: Compare-all dialog (§3.3)", () => {
  it("Entity colors compare-all keeps 18 hue rows and 8 palette columns", () => {
    click(document.querySelector("#btnCmpPals"))
    expect(document.querySelector("#cmpDialog")!.classList.contains("open")).toBe(true)
    expect(document.querySelectorAll("#cmpBody tr")).toHaveLength(18)
    expect(document.querySelectorAll("#cmpHead th")).toHaveLength(9) // 1 label col + 8 palettes
  })

  it("a column-header click selects that preset and closes the dialog", () => {
    click(document.querySelector("#btnCmpRamps"))
    const header = document.querySelectorAll("#cmpHead th")
    // th[0] is the "Step" label column, th[1] is the first preset (Home Assistant, index 0)
    expect(header[2].textContent).toBe("Rounded Theme")
    click(header[2])
    expect(document.querySelector("#cmpDialog")!.classList.contains("open")).toBe(false)
    // renderAll() rebuilds #rampList as part of closing the dialog, so re-query after the click
    expect(document.querySelectorAll("#rampList .preset-item")[1].getAttribute("aria-checked")).toBe("true")
  })

  it("Base tone's compare-all table has 13 rows, endpoints included (§2.7, §3.3)", () => {
    click(document.querySelector("#btnCmpRamps"))
    expect(document.querySelectorAll("#cmpBody tr")).toHaveLength(13)
    const firstRowLabel = document.querySelector("#cmpBody tr td.pos")!.textContent
    const lastRowLabel = document.querySelector("#cmpBody tr:last-child td.pos")!.textContent
    expect(firstRowLabel).toBe("neutral-00")
    expect(lastRowLabel).toBe("neutral-100")
  })
})

describe("wireframe: Export sheet (§1.4)", () => {
  it("opens from the app bar and defaults to the YAML tab", () => {
    click(document.querySelector("#btnExport"))
    expect(document.querySelector("#exportSheet")!.classList.contains("open")).toBe(true)
    expect(document.querySelector('#expTabs button[data-tab="yaml"]')!.getAttribute("aria-selected")).toBe(
      "true",
    )
    expect((document.querySelector("#tab-yaml") as HTMLElement).style.display).not.toBe("none")
  })

  it("switches to the Install tab and shows the at-most-one-webfont snippet copy", () => {
    click(document.querySelector("#btnExport"))
    click(document.querySelector('#expTabs button[data-tab="install"]'))
    expect(document.querySelector('#expTabs button[data-tab="install"]')!.getAttribute("aria-selected")).toBe(
      "true",
    )
    expect((document.querySelector("#tab-install") as HTMLElement).style.display).not.toBe("none")
    expect(document.querySelector("#tab-install")!.textContent).toMatch(/at most one/i)
  })

  it("closes on Escape", () => {
    click(document.querySelector("#btnExport"))
    press(document, "Escape")
    expect(document.querySelector("#exportSheet")!.classList.contains("open")).toBe(false)
  })

  it("the theme name field defaults to My Theme, matching DEFAULT_CONFIG.name", () => {
    click(document.querySelector("#btnExport"))
    expect(document.querySelector<HTMLInputElement>("#themeName")!.value).toBe("My Theme")
  })
})
