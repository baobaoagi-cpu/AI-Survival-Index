import type { QuizAnswerInput, QuizResult } from "@ai-survival/shared";
import { scoreQuiz } from "@ai-survival/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { createSupabaseAdmin } from "./supabase-admin.js";

export type CreateQuizSessionInput = {
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
  referrerProfileId?: string;
  inviteCode?: string;
  answers: QuizAnswerInput[];
  supabase?: SupabaseClient | null;
};

export type CreateQuizSessionResult = {
  result: QuizResult;
  persisted: boolean;
  sessionId: string | null;
  profileId: string | null;
};

export type ShareInvite = {
  inviteCode: string;
  ownerProfileId: string;
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
  const inviteOwnerProfileId = input.inviteCode ? await resolveInviteOwnerProfileId(supabase, input.inviteCode) : null;
  const ownerProfileId = inviteOwnerProfileId || input.referrerProfileId;
  if (profileId && ownerProfileId) {
    await linkReferral(supabase, ownerProfileId, profileId, inviteOwnerProfileId ? "quiz_invite" : "quiz_referral");
    if (input.inviteCode) await markInviteCompleted(supabase, input.inviteCode);
  }
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

export async function upsertProfile(
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

export async function createShareInvite(
  supabase: SupabaseClient,
  input: Pick<CreateQuizSessionInput, "lineUserId" | "displayName" | "pictureUrl"> & {
    source?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<ShareInvite> {
  const ownerProfileId = await upsertProfile(supabase, input);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode();
    const { data, error } = await supabase
      .from("share_invites")
      .insert({
        invite_code: inviteCode,
        owner_profile_id: ownerProfileId,
        source: input.source || "share_button",
        metadata: input.metadata || {},
      })
      .select("invite_code,owner_profile_id")
      .single();

    if (!error && data) {
      return {
        inviteCode: data.invite_code as string,
        ownerProfileId: data.owner_profile_id as string,
      };
    }

    const message = typeof error?.message === "string" ? error.message : "";
    if (!message.includes("duplicate") && !message.includes("unique")) {
      throw new QuizPersistenceError("Failed to create share invite", error);
    }
  }

  throw new QuizPersistenceError("Failed to create unique share invite", null);
}

export async function resolveInviteOwnerProfileId(
  supabase: SupabaseClient,
  inviteCode: string,
): Promise<string | null> {
  const code = normalizeInviteCode(inviteCode);
  if (!code) return null;

  const { data, error } = await supabase
    .from("share_invites")
    .select("owner_profile_id,expires_at")
    .eq("invite_code", code)
    .maybeSingle();

  if (error) {
    throw new QuizPersistenceError("Failed to resolve share invite", error);
  }

  if (!data?.owner_profile_id) return null;
  if (data.expires_at && new Date(data.expires_at as string).getTime() < Date.now()) return null;
  return data.owner_profile_id as string;
}

export async function markInviteOpened(supabase: SupabaseClient, inviteCode: string): Promise<void> {
  const code = normalizeInviteCode(inviteCode);
  if (!code) return;
  await fallbackIncrementInviteMetric(supabase, code, "open");
}

export async function markInviteAccepted(supabase: SupabaseClient, inviteCode: string): Promise<void> {
  const code = normalizeInviteCode(inviteCode);
  if (!code) return;
  await fallbackIncrementInviteMetric(supabase, code, "accept");
}

export async function markInviteCompleted(supabase: SupabaseClient, inviteCode: string): Promise<void> {
  const code = normalizeInviteCode(inviteCode);
  if (!code) return;
  await fallbackIncrementInviteMetric(supabase, code, "complete");
}

export async function linkReferral(
  supabase: SupabaseClient,
  ownerProfileId: string,
  friendProfileId: string,
  source = "line_liff_share",
): Promise<void> {
  if (!ownerProfileId || !friendProfileId || ownerProfileId === friendProfileId) return;

  const { error } = await supabase.from("friend_links").upsert(
    [
      {
        owner_profile_id: ownerProfileId,
        friend_profile_id: friendProfileId,
        source,
      },
      {
        owner_profile_id: friendProfileId,
        friend_profile_id: ownerProfileId,
        source: `${source}_reciprocal`,
      },
    ],
    { onConflict: "owner_profile_id,friend_profile_id" },
  );

  if (error) {
    throw new QuizPersistenceError("Failed to create friend link", error);
  }
}

function normalizeInviteCode(inviteCode: string): string {
  return inviteCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function generateInviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(10);
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

async function fallbackIncrementInviteMetric(
  supabase: SupabaseClient,
  inviteCode: string,
  metric: "open" | "accept" | "complete",
): Promise<void> {
  const column =
    metric === "open" ? "open_count" : metric === "accept" ? "accept_count" : "completed_count";
  const timestampColumn =
    metric === "open" ? "last_opened_at" : metric === "accept" ? "last_accepted_at" : "last_completed_at";

  const { data, error: readError } = await supabase
    .from("share_invites")
    .select(`${column}`)
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (readError || !data) return;

  await supabase
    .from("share_invites")
    .update({
      [column]: Number((data as Record<string, unknown>)[column] || 0) + 1,
      [timestampColumn]: new Date().toISOString(),
    })
    .eq("invite_code", inviteCode);
}
