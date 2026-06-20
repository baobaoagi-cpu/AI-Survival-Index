import { Hono } from "hono";
import { ARCHETYPES, QUIZ_SCENARIOS } from "@ai-survival/shared";

export const healthRoute = new Hono();

healthRoute.get("/", (c) =>
  c.json({
    ok: true,
    service: "ai-survival-api",
    archetypes: ARCHETYPES.length,
    scenarios: QUIZ_SCENARIOS.length,
  }),
);
