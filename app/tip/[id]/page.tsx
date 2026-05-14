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

  // Načíst i varianty (child tipy)
  const { data: variantsData } = await supabase
    .from("tips")
    .select("*")
    .eq("parent_id", id)
    .eq("hidden", false)
    .eq("pending", false);

  const variants: Tip[] = variantsData
    ? variantsData.map((r) => mapTip(r as Record<string, unknown>))
    : [];

  return <TipDetailClient initialTip={tip} initialVariants={variants} />;
}
