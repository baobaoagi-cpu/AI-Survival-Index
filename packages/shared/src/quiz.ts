import { ARCHETYPE_KEYS } from "./archetypes.js";
import { createQuizScenariosFromOptionBible, findOptionBibleEntry } from "./option-bible.js";
import { calculatePersonalityResult } from "./personality-calculator.js";
import type { ArchetypeKey, ArchetypeScores, QuizAnswerInput, QuizResult, QuizScenario } from "./types.js";

export const QUIZ_SCENARIOS: QuizScenario[] = createQuizScenariosFromOptionBible();

export function emptyScores(): ArchetypeScores {
  return Object.fromEntries(ARCHETYPE_KEYS.map((key) => [key, 0])) as ArchetypeScores;
}

export function scoreQuiz(inputs: QuizAnswerInput[]): QuizResult {
  const archetypeScores = emptyScores();
  const answers = inputs.map((input) => {
    const scenario = QUIZ_SCENARIOS.find((item) => item.id === input.scenarioId);
    if (!scenario) {
      throw new Error(`Unknown scenarioId: ${input.scenarioId}`);
    }

    const option = scenario.options.find((item) => item.id === input.optionId);
    const optionBibleEntry = findOptionBibleEntry(input.scenarioId, input.optionId);

    if (!option || !optionBibleEntry) {
      throw new Error(`Unknown optionId: ${input.optionId} for ${input.scenarioId}`);
    }

    const primaryArchetype = optionBibleEntry.primaryArchetype;
    archetypeScores[primaryArchetype] += 1;
    archetypeScores[optionBibleEntry.secondaryArchetype] += 0.5;

    return {
      ...input,
      archetypeKey: primaryArchetype,
      secondaryArchetype: optionBibleEntry.secondaryArchetype as ArchetypeKey,
      dimensionEffect: optionBibleEntry.dimensionEffect,
    };
  });

  const personalityResult = calculatePersonalityResult(inputs);

  return {
    answers,
    archetypeScores,
    dimensionScores: personalityResult.dimensionScores,
    archetypeMatches: personalityResult.archetypeMatches,
    primaryType: personalityResult.primaryType,
    secondaryType: personalityResult.secondaryType,
    evolutionType: personalityResult.evolutionType,
  };
}
