/**
 * Test helper: reads a file out of the read-only `.references/` directory.
 *
 * Throws on empty content. These files are the fixtures the engine's regression
 * tests diff against, so an empty read would make those tests pass without
 * asserting anything.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REFERENCES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.references");

/** Reads `.references/<relativePath>` as UTF-8 text. */
export function readReference(relativePath: string): string {
  const source = readFileSync(path.join(REFERENCES, relativePath), "utf8");
  if (source.trim() === "") {
    throw new Error(`.references/${relativePath} is empty — the tests reading it would pass without asserting anything`);
  }
  return source;
}
