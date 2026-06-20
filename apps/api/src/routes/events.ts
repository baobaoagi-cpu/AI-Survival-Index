import { Hono } from "hono";
import { createSupabaseAdmin } from "../services/supabase-admin.js";

type TrackEventBody = {
  eventName?: string;
  page?: string;
  scenarioId?: string;
  optionId?: string;
  profileId?: string;
  sessionId?: string;
  lineUserId?: string;
  metadata?: Record<string, unknown>;
};

export const eventsRoute = new Hono();

eventsRoute.post("/", async (c) => {
  const body = (await c.req.json().catch(() => null)) as TrackEventBody | null;
  const eventName = body?.eventName?.trim();

  if (!eventName) {
    return c.json({ error: "eventName is required" }, 400);
  }

  const supabase = createSupabaseAdmin();
  if (!supabase) {
    return c.json({ persisted: false, reason: "supabase is not configured" }, 202);
  }

  const lineUserId = body?.lineUserId || c.req.header("x-line-user-id") || null;
  const { error } = await supabase.from("user_events").insert({
    profile_id: body?.profileId || null,
    session_id: body?.sessionId || null,
    line_user_id: lineUserId,
    event_name: eventName,
    page: body?.page || null,
    scenario_id: body?.scenarioId || null,
    option_id: body?.optionId || null,
    metadata: {
      ...(body?.metadata ?? {}),
      userAgent: c.req.header("user-agent") || null,
      referer: c.req.header("referer") || null,
    },
  });

  if (error) {
    console.warn("Failed to persist user event", error);
    return c.json({ persisted: false, reason: error.message }, 202);
  }

  return c.json({ persisted: true });
});
