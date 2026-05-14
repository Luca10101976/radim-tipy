import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Support both ANON_KEY and PUBLISHABLE_KEY naming conventions
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("[Supabase] Missing env vars:", {
    url: !!supabaseUrl,
    key: !!supabaseKey,
  });
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Vypnout navigator lock - zpusobuje "lock was released because another request stole it"
    // pri konfliktu mezi getSession() a onAuthStateChange.
    // Místo toho používáme klasický mutex přes Promise (Supabase default fallback).
    lock: (_name, _acquireTimeout, fn) => fn(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
