"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTips, VoteType } from "@/lib/store";
import { TipWithStats } from "@/lib/types";
import LoginModal from "./LoginModal";

interface Props {
  tip: TipWithStats;
}

function SuccessBar({ rate, total }: { rate: number; total: number }) {
  // Pod 3 hlasy nezobrazujeme procenta ani bar — příliš málo dat
  if (total === 0) {
    return <p className="text-xs text-gray-300">Zatím bez hlasů</p>;
  }
  if (total < 3) {
    return (
      <p className="text-xs text-gray-400">
        {total === 1 ? "1 zkušenost" : `${total} zkušenosti`} — zatím málo dat
      </p>
    );
  }
  const pct = Math.round(rate * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-green-600 font-medium tabular-nums">👍 {pct}%</span>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            rate > 0.7 ? "bg-green-400" : rate >= 0.4 ? "bg-yellow-400" : "bg-red-400"
          }`}
          style={{ width: `${rate * 100}%` }}
        />
      </div>
      <span className="text-gray-400 tabular-nums">{total} hlasů</span>
    </div>
  );
}

export default function TipCard({ tip }: Props) {
  const { handleVote, votedTips, user, localReportedIds } = useTips();
  const myVote: VoteType | null = votedTips[tip.id] ?? null;
  const total = tip.votes_up + tip.votes_down;
  const [loginOpen, setLoginOpen] = useState(false);
  const isReported = localReportedIds.has(tip.id);

  function voteBtn(type: VoteType) {
    const isActive = myVote === type;
    const base =
      "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all select-none";
    if (type === "up") {
      return isActive
        ? `${base} bg-green-500 text-white`
        : `${base} bg-green-50 text-green-700 hover:bg-green-100 border border-green-200`;
    }
    return isActive
      ? `${base} bg-red-500 text-white`
      : `${base} bg-red-50 text-red-700 hover:bg-red-100 border border-red-200`;
  }

  function handleClick(type: VoteType) {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    handleVote(tip.id, type);
  }

  return (
    <>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <div className={`bg-white border rounded-2xl p-4 transition-all relative ${
        isReported
          ? "border-orange-200 opacity-60"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}>
        {isReported && (
          <div className="absolute top-2 right-2 text-xs bg-orange-100 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-medium">
            Nahlášeno
          </div>
        )}
        {/* Clickable content area */}
        <Link href={`/tip/${tip.id}`} className="block group mb-3">
          <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {tip.category}
            </span>
            {tip.parent_id && (
              <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">
                ↳ alternativa
              </span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight group-hover:text-indigo-700 transition-colors">
            {tip.title}
          </h3>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{tip.solution}</p>

          {/* Radim říká — jen když je jasná většina */}
          {tip.votes_up !== tip.votes_down && (tip.votes_up + tip.votes_down) >= 3 && (
            <div className="flex items-center gap-2 mb-3">
              <Image
                src="/radim-maskot.png"
                alt="Radim"
                width={22}
                height={22}
                className="rounded-full flex-shrink-0"
              />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                tip.votes_up > tip.votes_down
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}>
                {tip.votes_up > tip.votes_down ? "👍 Radim doporučuje" : "👎 Radim nedoporučuje"}
              </span>
            </div>
          )}

          <SuccessBar rate={tip.success_rate} total={total} />
          {tip.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tip.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </Link>

        {/* Vote buttons – separate from Link to prevent navigation */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => handleClick("up")}
            className={voteBtn("up")}
            title={myVote === "up" ? "Zrušit hlas" : "Fungovalo mi"}
          >
            👍 <span className="tabular-nums">{tip.votes_up}</span>
          </button>
          <button
            onClick={() => handleClick("down")}
            className={voteBtn("down")}
            title={myVote === "down" ? "Zrušit hlas" : "Nefungovalo mi"}
          >
            👎 <span className="tabular-nums">{tip.votes_down}</span>
          </button>
          {myVote && (
            <span className="ml-auto text-xs text-gray-400 self-center">
              {myVote === "up" ? "✓ hlasoval/a jsi" : "✗ hlasoval/a jsi"}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
