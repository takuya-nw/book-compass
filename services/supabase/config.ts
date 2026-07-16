export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export type SupabaseConfigResult =
  | { configured: true; value: SupabasePublicConfig }
  | { configured: false; missing: string[] };

type PublicSupabaseEnvironment = {
  url?: string;
  publishableKey?: string;
};

export function resolveSupabasePublicConfig(
  environment: PublicSupabaseEnvironment
): SupabaseConfigResult {
  const url = environment.url?.trim();
  const publishableKey = environment.publishableKey?.trim();
  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!publishableKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  if (missing.length > 0 || !url || !publishableKey) {
    return { configured: false, missing };
  }

  return {
    configured: true,
    value: { url, publishableKey }
  };
}

export function getSupabasePublicConfig(): SupabaseConfigResult {
  return resolveSupabasePublicConfig({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  });
}
