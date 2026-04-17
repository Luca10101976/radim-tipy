"use client";

import { useState } from "react";
import { useTips, VoteType } from "@/lib/store";
import { TipWithStats } from "@/lib/types";
import LoginModal from "./LoginModal";

interface Props {
  tip: TipWithStats;
}

function votesLabel(total: number): string {
  if (total === 0) return "Zatím nikdo nezkusil";
  if (total === 1) return "1 zkušenost";
  return `${total} zkušeností`;
}

function statsLabel(total: number, successRate: number): string | null {
  if (total === 0) return null;
  if (total < 3) {
    if (total === 1) return "Zatím 1 člověk vyzkoušel";
    return `Zatím málo zkušeností (${total} hlasy)`;
  }
  return `${Math.round(successRate * 100)} % lidí říká, že funguje (${total} hlasů)`;
}

export default function VoteButtons({ tip }: Props) {
  const { handleVote, votedTips, user } = useTips();
  const myVote = votedTips[tip.id] ?? null;
  const total = tip.votes_up + tip.votes_down;
  const [loginOpen, setLoginOpen] = useState(false);

  function btnClass(type: VoteType) {
    const isActive = myVote === type;
    const base =
      "flex-1 flex items-center justify-center gap-2 py-4 px-5 rounded-xl font-semibold text-base transition-all select-none";
    if (type === "up") {
      return isActive
        ? `${base} bg-green-500 text-white shadow-md ring-2 ring-green-300`
        : `${base} bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 hover:scale-[1.01]`;
    }
    return isActive
      ? `${base} bg-red-500 text-white shadow-md ring-2 ring-red-300`
      : `${base} bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 hover:scale-[1.01]`;
  }

  function handleClick(type: VoteType) {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    handleVote(tip.id, type);
  }

  const label = statsLabel(total, tip.success_rate);

  return (
    <>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <div className="flex flex-col gap-5">
        {/* Buttons */}
        <div className="flex gap-4">
          <button onClick={() => handleClick("up")} className={btnClass("up")}>
            <span className="text-2xl">👍</span>
            Fungovalo mi
          </button>
          <button onClick={() => handleClick("down")} className={btnClass("down")}>
            <span className="text-2xl">👎</span>
            Nefungovalo mi
          </button>
        </div>

        {myVote !== null && (
          <p className="text-center text-xs text-gray-400">
            Klikni znovu pro zrušení hlasu
          </p>
        )}

        {/* Counts row */}
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className={`font-medium tabular-nums ${myVote === "up" ? "text-green-600" : "text-gray-500"}`}>
            👍 {tip.votes_up}
          </span>

          {/* Progress bar — only when enough votes */}
          {total >= 3 ? (
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  tip.success_rate > 0.7
                    ? "bg-green-400"
                    : tip.success_rate >= 0.4
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${tip.success_rate * 100}%` }}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}

          <span className={`font-medium tabular-nums ${myVote === "down" ? "text-red-500" : "text-gray-500"}`}>
            👎 {tip.votes_down}
          </span>
        </div>

        {/* Stats text */}
        {label && (
          <p className="text-center text-sm font-medium text-gray-700">
            {label}
          </p>
        )}

        {/* Votes count */}
        <p className="text-center text-xs text-gray-400">
          {votesLabel(total)}
        </p>
      </div>
    </>
  );
}
