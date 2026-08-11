/**
 * Test helper: reads a file out of the read-only `.references/` directory.
 *
 * Vitest runs in Node, so the tests read their source material off disk
 * directly. Going through Vite's `?raw` loader instead would mean fighting two
 * unrelated transforms — `@tailwindcss/vite` claims every `.css` id regardless
 * of the query suffix, and Vitest stubs CSS modules by extension — and a lost
 * fight there returns an empty string, which would quietly turn the regression
 * tests below into assertions about nothing.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REFERENCES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.references");

/** Reads `.references/<relativePath>` as UTF-8 text. */
export function readReference(relativePath: string): string {
  const source = readFileSync(path.join(REFERENCES, relativePath), "utf8");
  if (source.trim() === "") {
    throw new Error(`.references/${relativePath} is empty — the tests below would assert nothing`);
  }
  return source;
}
