import { NextRequest } from "next/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedUser } from "@/lib/apiAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonError, jsonRateLimited, jsonValidationError } from "@/lib/apiResponse";
import { voteSchema, voteDeleteSchema } from "@/lib/validation";

async function getTipVoteCounts(supabase: SupabaseClient, tipId: string) {
  const { data, error } = await supabase
    .from("tips")
    .select("votes_up, votes_down, hidden, pending")
    .eq("id", tipId)
    .single();

  if (error || !data || data.hidden || data.pending) return null;
  return { votes_up: data.votes_up as number, votes_down: data.votes_down as number };
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return jsonError("Přihlášení je vyžadováno.", 401);

  const ip = getClientIp(request);
  const rate = checkRateLimit(`votes:${auth.user.id}:${ip}`, 60, 60 * 1000);
  if (!rate.allowed) return jsonRateLimited(rate.retryAfterMs);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Neplatný JSON.", 400);
  }

  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  const { tipId, voteType } = parsed.data;

  const { data: tip, error: tipError } = await auth.supabase
    .from("tips")
    .select("id, hidden, pending")
    .eq("id", tipId)
    .single();

  if (tipError || !tip || tip.hidden || tip.pending) {
    return jsonError("Tip není k dispozici pro hlasování.", 400);
  }

  const { error } = await auth.supabase.from("votes").upsert(
    { tip_id: tipId, user_id: auth.user.id, vote_type: voteType },
    { onConflict: "tip_id,user_id" }
  );

  if (error) {
    console.error("[api/votes POST]", error.message);
    return jsonError("Hlas se nepodařilo uložit.", 500);
  }

  const counts = await getTipVoteCounts(auth.supabase, tipId);
  if (!counts) return jsonError("Tip není k dispozici.", 400);

  return Response.json({ ok: true, ...counts });
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return jsonError("Přihlášení je vyžadováno.", 401);

  const ip = getClientIp(request);
  const rate = checkRateLimit(`votes:${auth.user.id}:${ip}`, 60, 60 * 1000);
  if (!rate.allowed) return jsonRateLimited(rate.retryAfterMs);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Neplatný JSON.", 400);
  }

  const parsed = voteDeleteSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  const { tipId } = parsed.data;

  const { error } = await auth.supabase
    .from("votes")
    .delete()
    .eq("tip_id", tipId)
    .eq("user_id", auth.user.id);

  if (error) {
    console.error("[api/votes DELETE]", error.message);
    return jsonError("Hlas se nepodařilo odebrat.", 500);
  }

  const counts = await getTipVoteCounts(auth.supabase, tipId);
  if (!counts) return jsonError("Tip není k dispozici.", 400);

  return Response.json({ ok: true, ...counts });
}
