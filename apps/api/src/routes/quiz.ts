import { Hono } from "hono";
import type { QuizAnswerInput } from "@ai-survival/shared";
import { createQuizSession, QuizPersistenceError } from "../services/quiz-session-service.js";

export const quizRoute = new Hono();

quizRoute.post("/score", async (c) => {
  let body: { answers?: QuizAnswerInput[]; referrerProfileId?: string; inviteCode?: string };

  try {
    body = (await c.req.json()) as { answers?: QuizAnswerInput[]; referrerProfileId?: string; inviteCode?: string };
  } catch {
    return c.json({ error: "body must be valid JSON" }, 400);
  }

  if (!Array.isArray(body.answers)) {
    return c.json({ error: "answers must be an array" }, 400);
  }

  const lineUserId = c.req.header("x-line-user-id");
  const displayName = c.req.header("x-line-display-name");
  const pictureUrl = c.req.header("x-line-picture-url");

  try {
    const session = await createQuizSession({
      answers: body.answers,
      ...(lineUserId ? { lineUserId } : {}),
      ...(displayName ? { displayName } : {}),
      ...(pictureUrl ? { pictureUrl } : {}),
      ...(body.referrerProfileId ? { referrerProfileId: body.referrerProfileId } : {}),
      ...(body.inviteCode ? { inviteCode: body.inviteCode } : {}),
    });

    return c.json({
      ...session.result,
      persisted: session.persisted,
      sessionId: session.sessionId,
      profileId: session.profileId,
    });
  } catch (error) {
    if (error instanceof QuizPersistenceError) {
      console.error(error.message, error.cause);
      return c.json({ error: "failed to persist quiz result" }, 500);
    }

    if (error instanceof Error && error.message.startsWith("Unknown ")) {
      return c.json({ error: error.message }, 400);
    }

    throw error;
  }
});
