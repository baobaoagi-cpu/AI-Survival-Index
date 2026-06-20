import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { readEnv } from "./env.js";
import { healthRoute } from "./routes/health.js";
import { quizRoute } from "./routes/quiz.js";
import { lineRoute } from "./routes/line.js";

const env = readEnv();
const app = new Hono();

app.use(
  "*",
  cors({
    origin: env.appOrigins,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Line-Signature",
      "X-Line-User-Id",
      "X-Line-Display-Name",
      "X-Line-Picture-Url",
    ],
  }),
);
app.options("*", (c) => c.body(null, 204));

app.route("/health", healthRoute);
app.route("/quiz", quizRoute);
app.route("/line", lineRoute);

serve({ fetch: app.fetch, port: env.port });

console.info(`AI Survival API listening on :${env.port}`);
