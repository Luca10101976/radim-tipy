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

// Klientský Supabase klient — pouze pro auth a klientské mutace
// (hlasování, přidání tipu, admin akce). Veřejné čtení tipů
// jde přes serverový klient v lib/supabaseServer.ts
export const supabase = createClient(supabaseUrl, supabaseKey);
