"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Tip } from "./types";
import { MOCK_TIPS } from "./mockData";

export type VoteType = "up" | "down";

interface TipsContextValue {
  tips: Tip[];
  votedTips: Record<string, VoteType>;
  handleVote: (tipId: string, type: VoteType) => void;
  addTip: (tip: Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">) => void;
  getTip: (id: string) => Tip | undefined;
}

const TipsContext = createContext<TipsContextValue | null>(null);

export function TipsProvider({ children }: { children: React.ReactNode }) {
  const [tips, setTips] = useState<Tip[]>(MOCK_TIPS);
  const [votedTips, setVotedTips] = useState<Record<string, VoteType>>({});

  useEffect(() => {
    try {
      const storedTips = localStorage.getItem("radim_tips");
      const storedVotes = localStorage.getItem("radim_votes");
      if (storedTips) setTips(JSON.parse(storedTips));
      if (storedVotes) setVotedTips(JSON.parse(storedVotes));
    } catch {
      // ignore
    }
  }, []);

  const persist = useCallback(
    (nextTips: Tip[], nextVotes: Record<string, VoteType>) => {
      try {
        localStorage.setItem("radim_tips", JSON.stringify(nextTips));
        localStorage.setItem("radim_votes", JSON.stringify(nextVotes));
      } catch {
        // ignore
      }
    },
    []
  );

  /**
   * handleVote – full toggle/change logic:
   *
   * same type as current → toggle off (null)
   * different type       → switch vote
   * no vote              → add vote
   */
  const handleVote = useCallback(
    (tipId: string, type: VoteType) => {
      const current = votedTips[tipId] ?? null;

      let upDelta = 0;
      let downDelta = 0;
      let newVote: VoteType | null = null;

      if (type === "up") {
        if (current === null) {
          upDelta = 1;
          newVote = "up";
        } else if (current === "down") {
          downDelta = -1;
          upDelta = 1;
          newVote = "up";
        } else {
          // current === "up" → toggle off
          upDelta = -1;
          newVote = null;
        }
      } else {
        if (current === null) {
          downDelta = 1;
          newVote = "down";
        } else if (current === "up") {
          upDelta = -1;
          downDelta = 1;
          newVote = "down";
        } else {
          // current === "down" → toggle off
          downDelta = -1;
          newVote = null;
        }
      }

      const nextVotes = { ...votedTips };
      if (newVote === null) {
        delete nextVotes[tipId];
      } else {
        nextVotes[tipId] = newVote;
      }

      const nextTips = tips.map((t) => {
        if (t.id !== tipId) return t;
        return {
          ...t,
          votes_up: Math.max(0, t.votes_up + upDelta),
          votes_down: Math.max(0, t.votes_down + downDelta),
        };
      });

      setVotedTips(nextVotes);
      setTips(nextTips);
      persist(nextTips, nextVotes);
    },
    [tips, votedTips, persist]
  );

  const addTip = useCallback(
    (tip: Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">) => {
      const newTip: Tip = {
        ...tip,
        id: Date.now().toString(),
        votes_up: tip.authorResult === "fungovalo" ? 1 : 0,
        votes_down: tip.authorResult === "nefungovalo" ? 1 : 0,
        createdAt: new Date().toISOString().split("T")[0],
      };
      const nextTips = [newTip, ...tips];
      setTips(nextTips);
      persist(nextTips, votedTips);
    },
    [tips, votedTips, persist]
  );

  const getTip = useCallback(
    (id: string) => tips.find((t) => t.id === id),
    [tips]
  );

  return (
    <TipsContext.Provider
      value={{ tips, votedTips, handleVote, addTip, getTip }}
    >
      {children}
    </TipsContext.Provider>
  );
}

export function useTips() {
  const ctx = useContext(TipsContext);
  if (!ctx) throw new Error("useTips must be used inside TipsProvider");
  return ctx;
}
