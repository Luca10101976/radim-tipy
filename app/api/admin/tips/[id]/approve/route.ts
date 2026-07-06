import { NextRequest } from "next/server";
import { getAuthenticatedUser, isAdminUser } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiResponse";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return jsonError("Přihlášení je vyžadováno.", 401);
  if (!isAdminUser(auth.user.id)) return jsonError("Zakázáno.", 403);

  const { id } = await context.params;
  if (!id) return jsonError("Chybí ID tipu.", 400);

  const { error } = await auth.supabase
    .from("tips")
    .update({ pending: false })
    .eq("id", id);

  if (error) {
    console.error("[api/admin approve]", error.message);
    return jsonError("Schválení selhalo.", 500);
  }

  return Response.json({ ok: true });
}
