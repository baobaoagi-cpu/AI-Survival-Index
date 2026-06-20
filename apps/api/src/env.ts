import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type ApiEnv = {
  port: number;
  appOrigin: string;
  appOrigins: string[];
  supabaseUrl: string | undefined;
  supabaseServiceRoleKey: string | undefined;
  lineChannelSecret: string | undefined;
  lineChannelAccessToken: string | undefined;
};

loadLocalEnvFiles();

export function readEnv(env = process.env): ApiEnv {
  const appOrigin =
    env.APP_ORIGIN ||
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8765,http://127.0.0.1:8765,null";

  return {
    port: Number(env.PORT || 8080),
    appOrigin,
    appOrigins: appOrigin.split(",").map((origin) => origin.trim()).filter(Boolean),
    supabaseUrl: env.SUPABASE_URL,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    lineChannelSecret: env.LINE_CHANNEL_SECRET,
    lineChannelAccessToken: env.LINE_CHANNEL_ACCESS_TOKEN,
  };
}

function loadLocalEnvFiles() {
  const candidates = [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env.local"),
    resolve(process.cwd(), "../../.env"),
  ];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex <= 0) continue;
      const key = trimmed.slice(0, equalsIndex).trim();
      const value = trimmed
        .slice(equalsIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}
