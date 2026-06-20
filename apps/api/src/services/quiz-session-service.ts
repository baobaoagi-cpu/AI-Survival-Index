import type { QuizAnswerInput, QuizResult } from "@ai-survival/shared";
import { scoreQuiz } from "@ai-survival/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "./supabase-admin.js";

export type CreateQuizSessionInput = {
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
  answers: QuizAnswerInput[];
  supabase?: SupabaseClient | null;
};

export type CreateQuizSessionResult = {
  result: QuizResult;
  persisted: boolean;
  sessionId: string | null;
  profileId: string | null;
};

export class QuizPersistenceError extends Error {
  constructor(
    message: string,
    readonly cause: unknown,
  ) {
    super(message);
    this.name = "QuizPersistenceError";
  }
}

export async function createQuizSession(input: CreateQuizSessionInput): Promise<CreateQuizSessionResult> {
  const result = scoreQuiz(input.answers);
  const supabase = input.supabase === undefined ? createSupabaseAdmin() : input.supabase;

  if (!supabase) {
    return {
      result,
      persisted: false,
      sessionId: null,
      profileId: null,
    };
  }

  const profileId = input.lineUserId ? await upsertProfile(supabase, input) : null;
  const completedAt = new Date().toISOString();

  const { data: session, error: sessionError } = await supabase
    .from("quiz_sessions")
    .insert({
      profile_id: profileId,
      status: "completed",
      primary_type: result.primaryType,
      secondary_type: result.secondaryType,
      evolution_type: result.evolutionType,
      archetype_scores: result.archetypeScores,
      dimension_scores: result.dimensionScores,
      completed_at: completedAt,
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw new QuizPersistenceError("Failed to create quiz session", sessionError);
  }

  const answerRows = result.answers.map((answer) => ({
    session_id: session.id,
    scenario_id: answer.scenarioId,
    option_id: answer.optionId,
    archetype_key: answer.archetypeKey,
    dimension_effect: answer.dimensionEffect,
  }));

  const { error: answersError } = await supabase.from("quiz_answers").insert(answerRows);

  if (answersError) {
    throw new QuizPersistenceError("Failed to create quiz answers", answersError);
  }

  const { error: resultError } = await supabase.from("archetype_results").insert({
    session_id: session.id,
    profile_id: profileId,
    primary_type: result.primaryType,
    secondary_type: result.secondaryType,
    evolution_type: result.evolutionType,
    archetype_scores: result.archetypeScores,
    dimension_scores: result.dimensionScores,
  });

  if (resultError) {
    throw new QuizPersistenceError("Failed to create archetype result", resultError);
  }

  return {
    result,
    persisted: true,
    sessionId: session.id,
    profileId,
  };
}

async function upsertProfile(
  supabase: SupabaseClient,
  input: Pick<CreateQuizSessionInput, "lineUserId" | "displayName" | "pictureUrl">,
): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        line_user_id: input.lineUserId,
        display_name: input.displayName,
        picture_url: input.pictureUrl,
      },
      { onConflict: "line_user_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new QuizPersistenceError("Failed to upsert profile", error);
  }

  return data.id;
}
