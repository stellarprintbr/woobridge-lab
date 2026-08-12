import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Server-only: uses the service_role key, which bypasses RLS. Never import this
// from a client component or expose the key with a NEXT_PUBLIC_ prefix.
export function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see supabase/schema.sql and README.md)"
    );
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
