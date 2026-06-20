import { Hono } from "hono";

export const lineRoute = new Hono();

lineRoute.post("/webhook", async (c) => {
  // TODO: verify X-Line-Signature before processing events.
  const body = await c.req.json();
  return c.json({ ok: true, received: Array.isArray(body.events) ? body.events.length : 0 });
});
