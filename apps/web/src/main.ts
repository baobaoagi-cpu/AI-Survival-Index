import { ARCHETYPES, QUIZ_SCENARIOS, scoreQuiz } from "@ai-survival/shared";

console.info("AI Survival web shell ready", {
  archetypes: ARCHETYPES.length,
  scenarios: QUIZ_SCENARIOS.length,
  sampleResult: scoreQuiz([
    { scenarioId: "scene-01-message", optionId: "a" },
    { scenarioId: "scene-02-system-change", optionId: "b" },
  ]),
});
