import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/services/supabase/config";

export type SupabaseClientResult =
  | { ok: true; client: SupabaseClient }
  | { ok: false; error: string };

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClientResult {
  const config = getSupabasePublicConfig();
  if (!config.configured) {
    return {
      ok: false,
      error: "Supabaseの接続情報がまだ設定されていません。"
    };
  }

  browserClient ??= createClient(
    config.value.url,
    config.value.publishableKey,
    {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    }
  );

  return { ok: true, client: browserClient };
}
