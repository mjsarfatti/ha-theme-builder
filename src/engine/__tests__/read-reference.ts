import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REFERENCES = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.references");

/**
 * Reads `.references/<relativePath>` as UTF-8 text.
 *
 * Throws on empty content. An empty fixture would let the regression tests
 * pass with an empty assertion set.
 */
export function readReference(relativePath: string): string {
  const source = readFileSync(path.join(REFERENCES, relativePath), "utf8");
  if (source.trim() === "") {
    throw new Error(`.references/${relativePath} is empty — the tests reading it would pass without asserting anything`);
  }
  return source;
}
