const assert = require("node:assert/strict");

async function main() {
  const shared = await import("../packages/shared/dist/index.js");
  const apiService = await import("../apps/api/dist/services/quiz-session-service.js");

  const answers = [
    { scenarioId: "scene-01-message", optionId: "a" },
    { scenarioId: "scene-02-system-change", optionId: "a" },
    { scenarioId: "scene-03-risk-opportunity", optionId: "c" },
    { scenarioId: "scene-04-friend-anxiety", optionId: "a" },
    { scenarioId: "scene-05-blank-canvas", optionId: "a" },
    { scenarioId: "scene-06-future-self", optionId: "a" },
  ];

  const dimensionScores = shared.calculateDimensionScores(answers);
  assert.equal(Object.keys(dimensionScores).length, 6, "dimensionScores must include six dimensions");
  for (const key of shared.DIMENSION_KEYS) {
    assert.equal(typeof dimensionScores[key], "number", `${key} must be a number`);
    assert.ok(dimensionScores[key] >= 0 && dimensionScores[key] <= 100, `${key} must be normalized`);
  }

  const archetypeMatches = shared.compareToArchetypes(dimensionScores, shared.ARCHETYPES);
  assert.equal(archetypeMatches.length, 9, "must compare against nine archetypes");
  assert.ok(archetypeMatches[0].distance <= archetypeMatches[1].distance, "matches must be sorted by distance");
  assert.equal(typeof archetypeMatches[0].similarityScore, "number", "match must include similarityScore");

  const personality = shared.calculatePersonalityResult(answers, shared.ARCHETYPES);
  assert.ok(personality.primaryType, "personality result must include primaryType");
  assert.ok(personality.secondaryType, "personality result must include secondaryType");
  assert.ok(personality.evolutionType, "personality result must include evolutionType");
  assert.deepEqual(personality.dimensionScores, dimensionScores, "personality result must expose dimensionScores");

  const scored = shared.scoreQuiz(answers);
  assert.ok(scored.dimensionScores, "scoreQuiz must include dimensionScores");
  assert.equal(scored.archetypeMatches.length, 9, "scoreQuiz must include archetypeMatches");
  assert.ok(scored.archetypeScores, "scoreQuiz must keep legacy archetypeScores");
  assert.equal(scored.answers.length, 6, "scoreQuiz must return answer details");
  assert.ok(scored.answers.every((answer) => answer.dimensionEffect), "answers must include dimensionEffect");

  const apiResult = await apiService.createQuizSession({ answers, supabase: null });
  assert.equal(apiResult.persisted, false, "null Supabase test should not persist");
  assert.ok(apiResult.result.dimensionScores, "API score service result must include dimensionScores");
  assert.equal(apiResult.result.archetypeMatches.length, 9, "API score service result must include archetypeMatches");

  const writes = [];
  const fakeSupabase = {
    from(table) {
      return {
        insert(payload) {
          writes.push({ table, payload });
          if (table === "quiz_sessions") {
            return {
              select() {
                return {
                  async single() {
                    return { data: { id: "test-session-id" }, error: null };
                  },
                };
              },
            };
          }
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  const persistedResult = await apiService.createQuizSession({ answers, supabase: fakeSupabase });
  assert.equal(persistedResult.persisted, true, "fake Supabase test should persist");

  const sessionWrite = writes.find((write) => write.table === "quiz_sessions");
  assert.ok(sessionWrite?.payload.dimension_scores, "quiz_sessions insert must include dimension_scores");

  const answerWrite = writes.find((write) => write.table === "quiz_answers");
  assert.ok(
    answerWrite?.payload.every((row) => row.dimension_effect),
    "quiz_answers insert must include dimension_effect per answer",
  );

  const resultWrite = writes.find((write) => write.table === "archetype_results");
  assert.ok(resultWrite?.payload.dimension_scores, "archetype_results insert must include dimension_scores");

  console.log("Alpha-05 dimension quiz engine checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
