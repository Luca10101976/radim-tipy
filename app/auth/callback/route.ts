import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "https://radim.pro";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Pouze redirect na vlastní doménu — ochrana před open redirect
  const safeOrigin =
    origin === ALLOWED_ORIGIN ||
    origin.endsWith(".vercel.app") ||
    origin === "http://localhost:3000"
      ? origin
      : ALLOWED_ORIGIN;

  // Zachovat původní stránku (např. /admin) pokud byla předána jako ?next=
  const next = searchParams.get("next") ?? "/";
  const safePath = next.startsWith("/") ? next : "/";

  return NextResponse.redirect(`${safeOrigin}${safePath}`);
}
