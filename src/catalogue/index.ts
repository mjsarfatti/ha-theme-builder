/**
 * Catalogue of the HA theme variables, read from the HA frontend source.
 *
 * `README.md` in this directory states the tier rule, the cascade model
 * and the YAML to CSS pipeline.
 *
 * @example
 * getHaVariable("primary-color")?.references; // ["ha-color-primary-40"]
 */
import { HA_VARIABLES, type HaVariable } from "./ha-variables.ts";

export { HA_FRONTEND_SHA, HA_VARIABLES, type HaComputed, type HaVariable, type HaVariableTier } from "./ha-variables.ts";

const BY_NAME = new Map(HA_VARIABLES.map((v) => [v.name, v]));

/** Returns the catalogue entry for a bare variable name (no `--`). */
export const getHaVariable = (name: string): HaVariable | undefined => BY_NAME.get(name);
