// Matches the first row inserted by the optional seed section at the bottom of
// supabase/schema.sql. Used only to prefill docs/playground examples — the real
// source of truth for auth is always the `credentials` table in Supabase.
export const DEMO_CREDENTIAL = {
  key: "ck_woobridge_lab_a1b2c3d4e5f60708",
  secret: "cs_woobridge_lab_9f8e7d6c5b4a3210",
};
