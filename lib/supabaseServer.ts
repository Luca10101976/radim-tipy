import { createClient } from "@supabase/supabase-js";

// Serverový Supabase klient — používá se v server components.
// Žádný persistovaný session, žádný auth state, žádné locks.
// Pouze pro veřejné čtení (anon key + RLS policy "Public read tips").
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
