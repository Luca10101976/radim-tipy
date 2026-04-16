"use client";

import { useState } from "react";
import { useTips, VoteType } from "@/lib/store";
import { TipWithStats } from "@/lib/types";
import LoginModal from "./LoginModal";

interface Props {
  tip: TipWithStats;
}

export default function VoteButtons({ tip }: Props) {
  const { handleVote, votedTips, user } = useTips();
  const myVote = votedTips[tip.id] ?? null;
  const total = tip.votes_up + tip.votes_down;
  const [loginOpen, setLoginOpen] = useState(false);

  function btnClass(type: VoteType) {
    const isActive = myVote === type;
    const base =
      "flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-base transition-all select-none";
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

  return (
    <>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <button onClick={() => handleClick("up")} className={btnClass("up")}>
            <span className="text-xl">👍</span>
            Fungovalo mi
          </button>
          <button onClick={() => handleClick("down")} className={btnClass("down")}>
            <span className="text-xl">👎</span>
            Nefungovalo mi
          </button>
        </div>

        {myVote !== null && (
          <p className="text-center text-xs text-gray-400">
            Klikni znovu pro zrušení hlasu
          </p>
        )}

        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span
            className={`font-medium tabular-nums ${myVote === "up" ? "text-green-600" : "text-gray-500"}`}
          >
            👍 {tip.votes_up}
          </span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                tip.success_rate > 0.7
                  ? "bg-green-400"
                  : tip.success_rate >= 0.4
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
              style={{ width: total === 0 ? "0%" : `${tip.success_rate * 100}%` }}
            />
          </div>
          <span
            className={`font-medium tabular-nums ${myVote === "down" ? "text-red-500" : "text-gray-500"}`}
          >
            👎 {tip.votes_down}
          </span>
        </div>

        {total > 0 ? (
          <p className="text-center text-sm font-medium text-gray-700">
            {Math.round(tip.success_rate * 100)} % lidí říká, že funguje
            <span className="text-gray-400 font-normal"> ({total} hodnocení)</span>
          </p>
        ) : (
          <p className="text-center text-sm text-gray-400">Zatím nikdo nehlasoval.</p>
        )}
      </div>
    </>
  );
}
