import { NextRequest } from "next/server";
import { getAuthenticatedUser, isAdminUser } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiResponse";

type RouteContext = { params: Promise<{ tipId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return jsonError("Přihlášení je vyžadováno.", 401);
  if (!isAdminUser(auth.user.id)) return jsonError("Zakázáno.", 403);

  const { tipId } = await context.params;
  if (!tipId) return jsonError("Chybí ID tipu.", 400);

  const { error: reportError } = await auth.supabase
    .from("reports")
    .delete()
    .eq("tip_id", tipId);

  if (reportError) {
    console.error("[api/admin dismiss reports]", reportError.message);
    return jsonError("Zrušení nahlášení selhalo.", 500);
  }

  const { error: tipError } = await auth.supabase
    .from("tips")
    .update({ hidden: false })
    .eq("id", tipId);

  if (tipError) {
    console.error("[api/admin dismiss tip]", tipError.message);
    return jsonError("Obnovení tipu selhalo.", 500);
  }

  return Response.json({ ok: true });
}
