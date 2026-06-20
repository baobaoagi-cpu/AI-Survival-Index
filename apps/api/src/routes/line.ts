import { createHmac, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { readEnv } from "../env.js";
import { createSupabaseAdmin } from "../services/supabase-admin.js";

export const lineRoute = new Hono();
const env = readEnv();

lineRoute.get("/health", (c) =>
  c.json({
    ok: true,
    webhookConfigured: Boolean(env.lineChannelSecret),
    messagingConfigured: Boolean(env.lineChannelAccessToken),
  }),
);

lineRoute.post("/webhook", async (c) => {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-line-signature") || "";

  if (!env.lineChannelSecret) {
    return c.json({ error: "LINE_CHANNEL_SECRET is not configured" }, 503);
  }

  if (!verifyLineSignature(rawBody, signature, env.lineChannelSecret)) {
    return c.json({ error: "invalid LINE signature" }, 401);
  }

  const body = JSON.parse(rawBody) as { events?: Array<Record<string, unknown>> };
  const events = Array.isArray(body.events) ? body.events : [];
  await persistLineEvents(events);

  return c.json({ ok: true, received: events.length });
});

function verifyLineSignature(rawBody: string, signature: string, channelSecret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function persistLineEvents(events: Array<Record<string, unknown>>) {
  if (events.length === 0) return;
  const supabase = createSupabaseAdmin();
  if (!supabase) return;

  const rows = events.map((event) => {
    const source = (event.source || {}) as Record<string, unknown>;
    return {
      line_user_id: typeof source.userId === "string" ? source.userId : null,
      event_name: `line_${String(event.type || "unknown")}`,
      page: "line_webhook",
      metadata: event,
    };
  });

  const { error } = await supabase.from("user_events").insert(rows);
  if (error) console.warn("Failed to persist LINE webhook events", error);
}
