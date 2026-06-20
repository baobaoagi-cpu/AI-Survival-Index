import { createHmac, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { ARCHETYPES, DIMENSION_KEYS, QUIZ_SCENARIOS, calculatePersonalityResult } from "@ai-survival/shared";
import { readEnv } from "../env.js";
import { createSupabaseAdmin } from "../services/supabase-admin.js";

const env = readEnv();

export const adminRoute = new Hono();

const ADMIN_SCENE_COPY: Record<
  string,
  { title: string; line: string; options: Record<string, string> }
> = {
  "scene-01-message": {
    title: "AI 來信",
    line: "AI 說：明天的工作已完成。",
    options: {
      a: "立刻探索新可能",
      b: "先磨好手上的工具",
      c: "先確認是否有風險",
    },
  },
  "scene-02-system-change": {
    title: "系統改版",
    line: "熟悉的流程突然全面改變。",
    options: {
      a: "帶大家找到方向",
      b: "先看懂背後規則",
      c: "把新工具練熟",
    },
  },
  "scene-03-risk-opportunity": {
    title: "風險機會",
    line: "市場出現一個模糊的訊號。",
    options: {
      a: "抓住價差與時機",
      b: "先判斷局勢",
      c: "做出新的解法",
    },
  },
  "scene-04-friend-anxiety": {
    title: "朋友焦慮",
    line: "朋友擔心自己被 AI 取代。",
    options: {
      a: "教他一起變強",
      b: "先守住他的安全感",
      c: "陪他看見下一步",
    },
  },
  "scene-05-blank-canvas": {
    title: "空白畫布",
    line: "你拿到一套全新的 AI 工具。",
    options: {
      a: "創造不存在的東西",
      b: "搭一個可用系統",
      c: "找出可交換的價值",
    },
  },
  "scene-06-future-self": {
    title: "未來自己",
    line: "你遇見一年後的自己。",
    options: {
      a: "問他看過哪些未知",
      b: "問他留下什麼結構",
      c: "問他幫助了誰",
    },
  },
};

adminRoute.post("/login", async (c) => {
  const body = (await c.req.json().catch(() => null)) as { username?: string; password?: string } | null;

  if (body?.username !== env.adminUsername || body?.password !== env.adminPassword) {
    return c.json({ error: "invalid admin credentials" }, 401);
  }

  const expiresAt = Date.now() + 1000 * 60 * 60 * 8;
  return c.json({
    token: signToken(body.username, expiresAt),
    user: { username: body.username },
    expiresAt,
  });
});

adminRoute.use("*", async (c, next) => {
  const authorization = c.req.header("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";

  if (!verifyToken(token)) {
    return c.json({ error: "admin authorization required" }, 401);
  }

  await next();
});

adminRoute.get("/summary", async (c) => {
  const supabase = requireSupabase();
  if (!supabase) return c.json({ error: "supabase is not configured" }, 503);

  const [profiles, sessions, shares, friendLinks, results, events, recentSessions] = await Promise.all([
    countRows(supabase, "profiles"),
    countRows(supabase, "quiz_sessions"),
    countRows(supabase, "share_events"),
    countRows(supabase, "friend_links"),
    supabase.from("archetype_results").select("primary_type, created_at").order("created_at", { ascending: false }).limit(1000),
    supabase
      .from("user_events")
      .select("event_name,scenario_id,occurred_at")
      .order("occurred_at", { ascending: false })
      .limit(3000),
    supabase.from("quiz_sessions").select("id,dimension_scores").order("created_at", { ascending: false }).limit(300),
  ]);

  const now = Date.now();
  const oneDayAgo = now - 1000 * 60 * 60 * 24;
  const recentResults = (results.data ?? []).filter((item) => Date.parse(String(item.created_at)) >= oneDayAgo);
  const distribution = countBy(results.data ?? [], "primary_type");
  const eventRows = events.data ?? [];
  const eventCounts = countBy(eventRows, "event_name");
  const answerEvents = eventRows.filter((event) => event.event_name === "answered_question");
  const answerCountsByScenario = countBy(answerEvents, "scenario_id");
  const recentSessionIds = (recentSessions.data ?? []).map((session) => session.id);
  const recentAnswers =
    recentSessionIds.length > 0
      ? await supabase
          .from("quiz_answers")
          .select("session_id,scenario_id,option_id,answered_at")
          .in("session_id", recentSessionIds)
      : { data: [], error: null };
  const scoredSessions = scoreSessionsWithStoredDimensions(recentSessions.data ?? [], recentAnswers.data ?? []);

  return c.json({
    totals: {
      users: profiles.count,
      quizSessions: sessions.count,
      shareEvents: shares.count,
      friendLinks: friendLinks.count,
      completedLast24h: recentResults.length,
      userEvents: events.error ? 0 : eventRows.length,
    },
    archetypeDistribution: distribution,
    dimensionAverages: averageDimensionScores(scoredSessions),
    similarityAverages: averageSimilarityScores(scoredSessions),
    funnel: {
      available: !events.error,
      error: events.error?.message ?? null,
      events: {
        openedApp: eventCounts.opened_app ?? 0,
        startedQuiz: eventCounts.started_quiz ?? 0,
        answeredQuestion: eventCounts.answered_question ?? 0,
        completedQuiz: eventCounts.completed_quiz ?? 0,
        viewedResult: eventCounts.viewed_result ?? 0,
        openedFriendWall: eventCounts.opened_friend_wall ?? 0,
        clickedShare: eventCounts.clicked_share ?? 0,
        clickedInvite: eventCounts.clicked_invite ?? 0,
        enteredMembershipPage: eventCounts.entered_membership_page ?? 0,
      },
      answerCountsByScenario,
    },
    health: {
      api: true,
      supabase: !profiles.error && !sessions.error,
      events: !events.error,
      lastCheckedAt: new Date().toISOString(),
    },
  });
});

adminRoute.get("/users", async (c) => {
  const supabase = requireSupabase();
  if (!supabase) return c.json({ error: "supabase is not configured" }, 503);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id,line_user_id,display_name,picture_url,locale,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return c.json({ error: error.message }, 500);

  const profileIds = (profiles ?? []).map((profile) => profile.id);
  const [sessions, friends, results] = await Promise.all([
    supabase.from("quiz_sessions").select("id,profile_id,status,primary_type,completed_at,created_at").in("profile_id", profileIds),
    supabase.from("friend_links").select("owner_profile_id,friend_profile_id").in("owner_profile_id", profileIds),
    supabase.from("archetype_results").select("profile_id,primary_type,secondary_type,evolution_type,created_at").in("profile_id", profileIds),
  ]);

  const sessionsByProfile = groupBy(sessions.data ?? [], "profile_id");
  const friendsByOwner = groupBy(friends.data ?? [], "owner_profile_id");
  const latestResultByProfile = latestBy(results.data ?? [], "profile_id", "created_at");

  return c.json({
    users: (profiles ?? []).map((profile) => ({
      ...profile,
      quizCount: sessionsByProfile.get(profile.id)?.length ?? 0,
      friendCount: friendsByOwner.get(profile.id)?.length ?? 0,
      latestResult: latestResultByProfile.get(profile.id) ?? null,
      latestSessionAt: latestTimestamp(sessionsByProfile.get(profile.id) ?? [], ["completed_at", "created_at"]),
    })),
  });
});

adminRoute.get("/quiz-sessions", async (c) => {
  const supabase = requireSupabase();
  if (!supabase) return c.json({ error: "supabase is not configured" }, 503);

  const { data: sessions, error } = await supabase
    .from("quiz_sessions")
    .select("id,profile_id,status,primary_type,secondary_type,evolution_type,archetype_scores,dimension_scores,started_at,completed_at,created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) return c.json({ error: error.message }, 500);

  const sessionIds = (sessions ?? []).map((session) => session.id);
  const profileIds = [...new Set((sessions ?? []).map((session) => session.profile_id).filter(Boolean))];
  const [answers, profiles] = await Promise.all([
    supabase.from("quiz_answers").select("session_id,scenario_id,option_id,archetype_key,dimension_effect,answered_at").in("session_id", sessionIds),
    supabase.from("profiles").select("id,line_user_id,display_name,picture_url").in("id", profileIds),
  ]);

  const answersBySession = groupBy(answers.data ?? [], "session_id");
  const profilesById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));

  return c.json({
    sessions: (sessions ?? []).map((session) => {
      const sessionAnswers = answersBySession.get(session.id) ?? [];
      const storedDimensionScores = normalizeStoredJson(session.dimension_scores);
      const score = storedDimensionScores
        ? {
            dimensionScores: storedDimensionScores,
            archetypeMatches: compareStoredDimensionScores(storedDimensionScores),
          }
        : scoreSessionAnswers(sessionAnswers);
      return {
        ...session,
        profile: session.profile_id ? profilesById.get(session.profile_id) ?? null : null,
        answers: sessionAnswers,
        dimensionScores: score?.dimensionScores ?? null,
        archetypeMatches: score?.archetypeMatches ?? [],
      };
    }),
  });
});

adminRoute.get("/question-assets", (c) => {
  return c.json({
    questions: QUIZ_SCENARIOS.map((scenario, index) => ({
      id: scenario.id,
      order: index + 1,
      title: ADMIN_SCENE_COPY[scenario.id]?.title ?? scenario.chTitle,
      line: ADMIN_SCENE_COPY[scenario.id]?.line ?? scenario.line,
      imagePath: `/assets/scenes/${scenario.id}.png`,
      imageStatus: "placeholder",
      options: scenario.options.map((option) => ({
        id: option.id,
        title: ADMIN_SCENE_COPY[scenario.id]?.options[option.id] ?? option.title,
        archetypeKey: option.archetypeKey,
      })),
    })),
    archetypes: ARCHETYPES.map((archetype) => ({
      key: archetype.key,
      id: archetype.id,
      name: archetype.name,
      portraitPath: archetype.imagePaths.portrait,
      shareCardPath: archetype.imagePaths.shareCard,
    })),
  });
});

adminRoute.get("/friend-links", async (c) => {
  const supabase = requireSupabase();
  if (!supabase) return c.json({ error: "supabase is not configured" }, 503);

  const { data: links, error } = await supabase
    .from("friend_links")
    .select("id,owner_profile_id,friend_profile_id,source,created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return c.json({ error: error.message }, 500);

  const profileIds = [
    ...new Set((links ?? []).flatMap((link) => [link.owner_profile_id, link.friend_profile_id]).filter(Boolean)),
  ];
  const { data: profiles } = await supabase.from("profiles").select("id,line_user_id,display_name,picture_url").in("id", profileIds);
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return c.json({
    links: (links ?? []).map((link) => ({
      ...link,
      owner: profilesById.get(link.owner_profile_id) ?? null,
      friend: profilesById.get(link.friend_profile_id) ?? null,
    })),
  });
});

function signToken(username: string, expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ username, expiresAt }), "utf8").toString("base64url");
  const signature = createHmac("sha256", env.adminSessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyToken(token: string): boolean {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = createHmac("sha256", env.adminSessionSecret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return false;

  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { username?: string; expiresAt?: number };
  return data.username === env.adminUsername && typeof data.expiresAt === "number" && data.expiresAt > Date.now();
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requireSupabase() {
  return createSupabaseAdmin();
}

async function countRows(supabase: NonNullable<ReturnType<typeof createSupabaseAdmin>>, table: string) {
  return supabase.from(table).select("*", { count: "exact", head: true });
}

function groupBy<T extends Record<string, unknown>>(items: T[], key: keyof T): Map<unknown, T[]> {
  const groups = new Map<unknown, T[]>();
  for (const item of items) {
    const value = item[key];
    groups.set(value, [...(groups.get(value) ?? []), item]);
  }
  return groups;
}

function latestBy<T extends Record<string, unknown>>(items: T[], groupKey: keyof T, dateKey: keyof T): Map<unknown, T> {
  const latest = new Map<unknown, T>();
  for (const item of items) {
    const current = latest.get(item[groupKey]);
    if (!current || Date.parse(String(item[dateKey])) > Date.parse(String(current[dateKey]))) {
      latest.set(item[groupKey], item);
    }
  }
  return latest;
}

function latestTimestamp(items: Record<string, unknown>[], keys: string[]): string | null {
  const timestamps = items.flatMap((item) => keys.map((key) => item[key]).filter(Boolean)).map((value) => String(value));
  return timestamps.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function countBy(items: Record<string, unknown>[], key: string): Record<string, number> {
  return items.reduce<Record<string, number>>((counts, item) => {
    const value = String(item[key] ?? "unknown");
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function scoreSessionsWithStoredDimensions(sessions: Record<string, unknown>[], answerRows: Record<string, unknown>[]) {
  const answersBySession = groupBy(answerRows, "session_id");

  return sessions
    .map((session) => {
      const storedDimensionScores = normalizeStoredJson(session.dimension_scores);
      if (storedDimensionScores) {
        return {
          dimensionScores: storedDimensionScores,
          archetypeMatches: compareStoredDimensionScores(storedDimensionScores),
        };
      }
      return scoreSessionAnswers(answersBySession.get(session.id) ?? []);
    })
    .filter((score): score is NonNullable<ReturnType<typeof scoreSessionAnswers>> => Boolean(score));
}

function scoreSessionAnswers(answerRows: Record<string, unknown>[]) {
  const answers = answerRows
    .slice()
    .sort((a, b) => Date.parse(String(a.answered_at ?? "")) - Date.parse(String(b.answered_at ?? "")))
    .map((answer) => ({
      scenarioId: String(answer.scenario_id ?? ""),
      optionId: String(answer.option_id ?? "a") as "a" | "b" | "c",
    }))
    .filter((answer) => answer.scenarioId && ["a", "b", "c"].includes(answer.optionId));

  if (answers.length === 0) return null;

  try {
    return calculatePersonalityResult(answers, ARCHETYPES);
  } catch {
    return null;
  }
}

function normalizeStoredJson(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const hasAnyDimension = DIMENSION_KEYS.some((key) => typeof record[key] === "number");
  if (!hasAnyDimension) return null;
  return Object.fromEntries(DIMENSION_KEYS.map((key) => [key, Number(record[key] ?? 0)]));
}

function compareStoredDimensionScores(dimensionScores: Record<string, number>) {
  const maxDistance = Math.sqrt(DIMENSION_KEYS.length * 100 * 100);
  return ARCHETYPES.map((archetype, index) => {
    const distance = Math.sqrt(
      DIMENSION_KEYS.reduce((total, key) => {
        const diff = (dimensionScores[key] ?? 0) - archetype.dimensionProfile[key];
        return total + diff * diff;
      }, 0),
    );
    return {
      key: archetype.key,
      name: archetype.name,
      distance: Number(distance.toFixed(4)),
      similarityScore: Math.max(0, Math.round((1 - distance / maxDistance) * 100)),
      index,
    };
  })
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .map(({ index, ...match }) => match);
}

function averageDimensionScores(scores: Array<{ dimensionScores: Record<string, number> }>): Record<string, number> {
  if (scores.length === 0) {
    return Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 0]));
  }

  return Object.fromEntries(
    DIMENSION_KEYS.map((key) => [
      key,
      Math.round(scores.reduce((total, score) => total + (score.dimensionScores[key] ?? 0), 0) / scores.length),
    ]),
  );
}

function averageSimilarityScores(
  scores: Array<{ archetypeMatches: Array<{ key: string; similarityScore: number }> }>,
): Record<string, number> {
  if (scores.length === 0) {
    return Object.fromEntries(ARCHETYPES.map((archetype) => [archetype.key, 0]));
  }

  return Object.fromEntries(
    ARCHETYPES.map((archetype) => {
      const total = scores.reduce((sum, score) => {
        const match = score.archetypeMatches.find((item) => item.key === archetype.key);
        return sum + (match?.similarityScore ?? 0);
      }, 0);
      return [archetype.key, Math.round(total / scores.length)];
    }),
  );
}
