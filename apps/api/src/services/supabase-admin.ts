import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readEnv, type ApiEnv } from "../env.js";

export function createSupabaseAdmin(env: ApiEnv = readEnv()): SupabaseClient | null {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
