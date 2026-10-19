import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"

import "./dev.css"
import { Preview } from "@/components/preview"
import { derive, type PartialThemeConfig } from "@/engine"

const FIXTURES: Record<string, PartialThemeConfig> = {
  "Home Assistant Refined (default)": {},
  Nightshade: {
    name: "Nightshade",
    colors: { primary: "#7c5cff" },
    neutralRamp: "mauve",
  },
  "Low-contrast primary (triggers the §4.3 warning)": {
    colors: { primary: "#8899aa" },
  },
  "Stone base tone, Tailwind v4 entity colors": {
    neutralRamp: "stone",
    palette: "tailwind-v4",
  },
  "Invisible border (match-card)": {
    borderColor: "match-card",
  },
}

type FixtureName = keyof typeof FIXTURES

function DevHarness() {
  const [fixtureName, setFixtureName] = useState<FixtureName>("Home Assistant Refined (default)")
  const theme = derive(FIXTURES[fixtureName])

  return (
    <div>
      <header className="flex items-center gap-3 border-b p-4">
        <strong>Preview pane — dev harness</strong>
        <label className="flex items-center gap-2 text-sm">
          Fixture
          <select
            className="rounded border px-2 py-1"
            value={fixtureName}
            onChange={(event) => setFixtureName(event.target.value as FixtureName)}
          >
            {Object.keys(FIXTURES).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </header>
      <Preview theme={theme} />
    </div>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DevHarness />
  </StrictMode>,
)
