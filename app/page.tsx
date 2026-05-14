import TipListClient from "@/components/TipListClient";
import { createServerSupabase } from "@/lib/supabaseServer";
import { mapTip, Tip } from "@/lib/types";

// Tato stránka se renderuje na serveru. Tipy se načtou z DB ještě
// před odesláním HTML klientovi → žádné blikání, žádný loading state,
// žádné lock konflikty se Supabase auth.
export const revalidate = 30; // ISR — regenerace co 30s

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("tips")
    .select("*")
    .eq("hidden", false)
    .eq("pending", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[server loadTips]", error);
  }

  const initialTips: Tip[] = data
    ? data.map((r) => mapTip(r as Record<string, unknown>))
    : [];

  return <TipListClient initialTips={initialTips} />;
}
