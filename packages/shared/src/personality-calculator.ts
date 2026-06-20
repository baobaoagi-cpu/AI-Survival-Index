import { ARCHETYPES, ARCHETYPE_KEYS } from "./archetypes.js";
import { addDimensionEffect, DIMENSION_KEYS, emptyDimensionScores, normalizeDimensionScores } from "./dimensions.js";
import { findOptionBibleEntry } from "./option-bible.js";
import type { Archetype, ArchetypeKey, ArchetypeMatch, DimensionScores, QuizAnswerInput } from "./types.js";

const MAX_DISTANCE = Math.sqrt(DIMENSION_KEYS.length * 100 * 100);

export type PersonalityResult = {
  dimensionScores: DimensionScores;
  archetypeMatches: ArchetypeMatch[];
  primaryType: ArchetypeKey;
  secondaryType: ArchetypeKey;
  evolutionType: ArchetypeKey;
};

export function calculateDimensionScores(answers: QuizAnswerInput[]): DimensionScores {
  const rawScores = answers.reduce((scores, answer) => {
    const entry = findOptionBibleEntry(answer.scenarioId, answer.optionId);
    if (!entry) {
      throw new Error(`Unknown optionId: ${answer.optionId} for ${answer.scenarioId}`);
    }
    return addDimensionEffect(scores, entry.dimensionEffect);
  }, emptyDimensionScores());

  return normalizeDimensionScores(rawScores);
}

export function compareToArchetypes(
  dimensionScores: DimensionScores,
  archetypes: readonly Archetype[] = ARCHETYPES,
): ArchetypeMatch[] {
  return archetypes
    .map((archetype) => {
      const distance = Math.sqrt(
        DIMENSION_KEYS.reduce((total, key) => {
          const diff = dimensionScores[key] - archetype.dimensionProfile[key];
          return total + diff * diff;
        }, 0),
      );
      return {
        key: archetype.key,
        name: archetype.name,
        distance: Number(distance.toFixed(4)),
        similarityScore: Math.max(0, Math.round((1 - distance / MAX_DISTANCE) * 100)),
      };
    })
    .sort((a, b) => a.distance - b.distance || ARCHETYPE_KEYS.indexOf(a.key) - ARCHETYPE_KEYS.indexOf(b.key));
}

const EVOLUTION_BY_PRIMARY: Record<ArchetypeKey, ArchetypeKey> = {
  explorer: "inventor",
  craftsman: "builder",
  guardian: "mentor",
  navigator: "strategist",
  strategist: "navigator",
  inventor: "explorer",
  trader: "strategist",
  mentor: "navigator",
  builder: "guardian",
};

export function calculatePersonalityResult(
  answers: QuizAnswerInput[],
  archetypes: readonly Archetype[] = ARCHETYPES,
): PersonalityResult {
  const dimensionScores = calculateDimensionScores(answers);
  const archetypeMatches = compareToArchetypes(dimensionScores, archetypes);
  const primaryType = archetypeMatches[0]?.key ?? "explorer";
  const secondaryType = archetypeMatches.find((item) => item.key !== primaryType)?.key ?? "navigator";
  const evolutionType = pickEvolutionType(primaryType, secondaryType, archetypeMatches, archetypes);

  return {
    dimensionScores,
    archetypeMatches,
    primaryType,
    secondaryType,
    evolutionType,
  };
}

function pickEvolutionType(
  primaryType: ArchetypeKey,
  secondaryType: ArchetypeKey,
  archetypeMatches: ArchetypeMatch[],
  archetypes: readonly Archetype[],
): ArchetypeKey {
  const preferred = EVOLUTION_BY_PRIMARY[primaryType];
  if (preferred !== primaryType && preferred !== secondaryType) {
    return preferred;
  }

  const primary = archetypes.find((item) => item.key === primaryType);
  const candidates = archetypeMatches.filter((item) => ![primaryType, secondaryType].includes(item.key));

  if (!primary || candidates.length === 0) {
    // TODO: Alpha-06 can replace this fallback with an explicit growth graph from Archetype Bible.
    return preferred !== primaryType ? preferred : "navigator";
  }

  return candidates
    .map((match) => {
      const archetype = archetypes.find((item) => item.key === match.key);
      if (!archetype) return { key: match.key, score: -Infinity };
      const growthLift =
        Math.max(0, archetype.dimensionProfile.influence - primary.dimensionProfile.influence) +
        Math.max(0, archetype.dimensionProfile.build - primary.dimensionProfile.build) +
        Math.max(0, archetype.dimensionProfile.action - primary.dimensionProfile.action);
      return {
        key: match.key,
        score: match.similarityScore + growthLift * 0.35,
      };
    })
    .sort((a, b) => b.score - a.score)[0]?.key ?? preferred;
}
