import { notFound } from "next/navigation";
import TipDetailClient from "./TipDetailClient";
import { createServerSupabase } from "@/lib/supabaseServer";
import { mapTip, Tip } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 30;

export default async function TipPage({ params }: Props) {
  const { id } = await params;

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("tips")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    notFound();
  }

  const tip: Tip = mapTip(data as Record<string, unknown>);

  // Načíst varianty (child tipy) a rodiče paralelně
  const [variantsRes, parentRes] = await Promise.all([
    supabase
      .from("tips")
      .select("*")
      .eq("parent_id", id)
      .eq("hidden", false)
      .eq("pending", false),
    tip.parent_id
      ? supabase.from("tips").select("id, title").eq("id", tip.parent_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const variants: Tip[] = variantsRes.data
    ? variantsRes.data.map((r) => mapTip(r as Record<string, unknown>))
    : [];

  const parentTitle: string | null =
    (parentRes.data as { id: string; title: string } | null)?.title ?? null;

  return (
    <TipDetailClient
      initialTip={tip}
      initialVariants={variants}
      parentTitle={parentTitle}
    />
  );
}
