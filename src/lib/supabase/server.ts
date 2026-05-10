import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  return url;
}

function getSupabaseKey() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return key;
}

export function createSupabaseServerClient() {
  return createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
