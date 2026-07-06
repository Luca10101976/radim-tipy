import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/apiAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonError, jsonRateLimited, jsonValidationError } from "@/lib/apiResponse";
import { reportSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return jsonError("Přihlášení je vyžadováno.", 401);

  const ip = getClientIp(request);
  const rate = checkRateLimit(`reports:${auth.user.id}:${ip}`, 10, 60 * 60 * 1000);
  if (!rate.allowed) return jsonRateLimited(rate.retryAfterMs);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Neplatný JSON.", 400);
  }

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  const { tipId, reason } = parsed.data;

  const { data: tip, error: tipError } = await auth.supabase
    .from("tips")
    .select("id, hidden, pending")
    .eq("id", tipId)
    .single();

  if (tipError || !tip || tip.hidden || tip.pending) {
    return jsonError("Tip nelze nahlásit.", 400);
  }

  const { error } = await auth.supabase.from("reports").upsert(
    { tip_id: tipId, user_id: auth.user.id, reason },
    { onConflict: "tip_id,user_id" }
  );

  if (error) {
    console.error("[api/reports POST]", error.message);
    return jsonError("Nahlášení se nepodařilo uložit.", 500);
  }

  return Response.json({ ok: true });
}
