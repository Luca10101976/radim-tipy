import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/apiAuth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { jsonError, jsonRateLimited, jsonValidationError } from "@/lib/apiResponse";
import { createTipSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return jsonError("Přihlášení je vyžadováno.", 401);

  const ip = getClientIp(request);
  const rate = checkRateLimit(`tips:${auth.user.id}:${ip}`, 5, 60 * 60 * 1000);
  if (!rate.allowed) return jsonRateLimited(rate.retryAfterMs);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Neplatný JSON.", 400);
  }

  const parsed = createTipSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  const input = parsed.data;
  let category = input.category;
  let problem = input.problem;
  let tags = input.tags;

  if (input.parent_id) {
    const { data: parent, error: parentError } = await auth.supabase
      .from("tips")
      .select("id, category, problem, tags, hidden, pending")
      .eq("id", input.parent_id)
      .single();

    if (parentError || !parent || parent.hidden || parent.pending) {
      return jsonError("Rodičovský tip neexistuje nebo není dostupný.", 400);
    }

    category = parent.category as typeof category;
    problem = parent.problem as string;
    tags = (parent.tags as string[]) ?? [];
  }

  const { error } = await auth.supabase.from("tips").insert({
    title: input.title,
    category,
    problem,
    solution: input.solution,
    author_result: input.authorResult,
    warning: input.warning ?? null,
    tags,
    votes_up: 0,
    votes_down: 0,
    user_id: auth.user.id,
    hidden: false,
    pending: true,
    parent_id: input.parent_id ?? null,
  });

  if (error) {
    console.error("[api/tips POST]", error.message);
    return jsonError("Tip se nepodařilo uložit.", 500);
  }

  return Response.json({ ok: true });
}
