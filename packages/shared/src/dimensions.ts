import type { DimensionEffect, DimensionKey, DimensionScores } from "./types.js";

export const DIMENSION_KEYS = ["explore", "action", "risk", "create", "influence", "build"] as const;

export type { DimensionEffect, DimensionKey, DimensionScores };

export function emptyDimensionScores(): DimensionScores {
  return Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 0])) as DimensionScores;
}

export function addDimensionEffect(scores: DimensionScores, effect: DimensionEffect): DimensionScores {
  const next = { ...scores };
  for (const key of DIMENSION_KEYS) {
    next[key] += effect[key] ?? 0;
  }
  return next;
}

export function normalizeDimensionScores(scores: DimensionScores): DimensionScores {
  const values = DIMENSION_KEYS.map((key) => scores[key]);
  const min = Math.min(0, ...values);
  const max = Math.max(...values);
  const range = max - min;

  if (range <= 0) {
    return emptyDimensionScores();
  }

  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [key, Math.round(((scores[key] - min) / range) * 100)]),
  ) as DimensionScores;
}
