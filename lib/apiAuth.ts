import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration");
  return { url, key };
}

export function createAuthedSupabase(accessToken: string): SupabaseClient {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient; accessToken: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) return null;

  const supabase = createAuthedSupabase(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) return null;
  return { user, supabase, accessToken };
}

/** Server-side admin check — uses ADMIN_USER_ID, never public email. */
export function isAdminUser(userId: string): boolean {
  const adminId = (process.env.ADMIN_USER_ID ?? "").trim();
  return !!adminId && userId === adminId;
}
