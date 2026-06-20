import { NextRequest } from "next/server";
import { getAuthenticatedUser, isAdminUser } from "@/lib/apiAuth";
import { jsonError } from "@/lib/apiResponse";

export async function DELETE(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (!auth) return jsonError("Přihlášení je vyžadováno.", 401);
  if (!isAdminUser(auth.user.id)) return jsonError("Zakázáno.", 403);

  const { error } = await auth.supabase
    .from("tips")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error("[api/admin delete-all]", error.message);
    return jsonError("Hromadné smazání selhalo.", 500);
  }

  return Response.json({ ok: true });
}
