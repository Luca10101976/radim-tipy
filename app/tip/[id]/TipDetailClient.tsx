"use client";

import { useTips } from "@/lib/store";
import { computeStats } from "@/lib/types";
import VoteButtons from "@/components/VoteButtons";
import RadimSection from "@/components/RadimSection";
import ReportButton from "@/components/ReportButton";
import VariantSection from "@/components/VariantSection";
import Link from "next/link";
import Image from "next/image";

interface Props {
  id: string;
}

export default function TipDetailClient({ id }: Props) {
  const { getTip, reportedTipIds, isAdmin } = useTips();
  const raw = getTip(id);

  if (!raw) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Tip nenalezen.</p>
        <Link href="/" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
          ← Zpět na hlavní stránku
        </Link>
      </div>
    );
  }

  // Reported tip — hide from public
  if (reportedTipIds.has(id) && !isAdmin) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-4">🚫</p>
        <p className="text-gray-700 font-medium mb-1">Tento tip byl nahlášen</p>
        <p className="text-sm text-gray-400 mb-6">Čeká na posouzení správcem.</p>
        <Link href="/" className="text-teal-600 text-sm hover:underline">
          ← Zpět na hlavní stránku
        </Link>
      </div>
    );
  }

  const tip = computeStats(raw);

  // If this is a variant, show a link back to the parent tip
  const isVariant = !!raw.parent_id;

  return (
    <div className="max-w-xl mx-auto">
      <Link href={isVariant ? `/tip/${raw.parent_id}` : "/"} className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-6 transition-colors">
        ← {isVariant ? "Zpět na původní tip" : "Zpět"}
      </Link>

      {isVariant && (
        <div className="mb-4 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
          Toto je alternativní způsob k jinému tipu.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
        {/* Header */}
        <div>
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {tip.category}
          </span>
          <h1 className="text-xl font-bold text-gray-900 mt-2 mb-1">{tip.title}</h1>
          <div className="flex flex-wrap gap-1">
            {tip.tags.map((tag) => (
              <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Problem */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Problém</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{tip.problem}</p>
        </section>

        {/* Solution */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Řešení</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{tip.solution}</p>
        </section>

        {/* Radim říká — podle poměru hlasů */}
        {tip.votes_up !== tip.votes_down && (tip.votes_up + tip.votes_down) > 0 && (
          <section>
            <div className="flex items-center gap-3">
              <Image
                src="/radim-maskot.png"
                alt="Radim"
                width={44}
                height={44}
                className="rounded-full flex-shrink-0"
              />
              <div className={`relative border rounded-2xl rounded-tl-none px-4 py-2.5 ${
                tip.votes_up > tip.votes_down
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}>
                <p className="text-xs text-gray-400 mb-0.5">Radim říká:</p>
                <p className={`text-sm font-semibold ${
                  tip.votes_up > tip.votes_down ? "text-green-700" : "text-red-600"
                }`}>
                  {tip.votes_up > tip.votes_down
                    ? "👍 Tohle doporučuji!"
                    : "👎 Zkusil bych něco jiného."}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Warning */}
        {tip.warning && (
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-600 mb-1">⚠️ Varování</h2>
            <p className="text-sm text-amber-800">{tip.warning}</p>
          </section>
        )}

        {/* Radim */}
        <RadimSection tip={tip} />

        {/* Voting */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Zkusil/a jsi to? Řekni ostatním
          </h2>
          <VoteButtons tip={tip} />
        </section>

        {/* Variants — only for main tips, not for variants themselves */}
        {!isVariant && <VariantSection parentTip={raw} />}

        {/* Report */}
        <ReportButton tipId={tip.id} />
      </div>
    </div>
  );
}
