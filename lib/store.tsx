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

const MAX_TIPS_PER_USER = 5;

// localStorage keys (per spec)
const LS = {
  votes:       "votes",
  tips:        "radim_tips",
  createdTips: "createdTips",
  userId:      "userId",
} as const;

function generateUserId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (private mode / quota)
  }
}

interface TipsContextValue {
  tips: Tip[];
  votedTips: Record<string, VoteType>;
  createdTips: string[];
  canAddTip: boolean;
  userId: string;
  handleVote: (tipId: string, type: VoteType) => void;
  addTip: (tip: Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">) => "ok" | "limit";
  getTip: (id: string) => Tip | undefined;
}

const TipsContext = createContext<TipsContextValue | null>(null);

export function TipsProvider({ children }: { children: React.ReactNode }) {
  const [tips, setTips]             = useState<Tip[]>(MOCK_TIPS);
  const [votedTips, setVotedTips]   = useState<Record<string, VoteType>>({});
  const [createdTips, setCreatedTips] = useState<string[]>([]);
  const [userId, setUserId]         = useState<string>("");

  // Hydrate from localStorage on first render
  useEffect(() => {
    // userId – create once, keep forever
    let uid = localStorage.getItem(LS.userId) ?? "";
    if (!uid) {
      uid = generateUserId();
      safeSet(LS.userId, uid);
    }
    setUserId(uid);

    // tips (user may have added some)
    const storedTips = safeGet<Tip[]>(LS.tips, []);
    if (storedTips.length) setTips(storedTips);

    // votes  { tipId: "up"|"down" }
    // migrate from old key "radim_votes" if new key is empty
    let storedVotes = safeGet<Record<string, VoteType>>(LS.votes, {});
    if (!Object.keys(storedVotes).length) {
      const legacy = safeGet<Record<string, VoteType>>("radim_votes", {});
      if (Object.keys(legacy).length) {
        storedVotes = legacy;
        safeSet(LS.votes, legacy);
      }
    }
    if (Object.keys(storedVotes).length) setVotedTips(storedVotes);

    // IDs of tips this user created
    const storedCreated = safeGet<string[]>(LS.createdTips, []);
    setCreatedTips(storedCreated);
  }, []);

  // ── handleVote ────────────────────────────────────────────────────────────
  // toggle / change / remove vote; persists to localStorage key "votes"
  const handleVote = useCallback(
    (tipId: string, type: VoteType) => {
      const current = votedTips[tipId] ?? null;

      let upDelta = 0;
      let downDelta = 0;
      let newVote: VoteType | null = null;

      if (type === "up") {
        if (current === null)       { upDelta = 1;                    newVote = "up";   }
        else if (current === "down"){ downDelta = -1; upDelta = 1;    newVote = "up";   }
        else                        { upDelta = -1;                   newVote = null;   } // toggle off
      } else {
        if (current === null)       { downDelta = 1;                  newVote = "down"; }
        else if (current === "up")  { upDelta = -1; downDelta = 1;    newVote = "down"; }
        else                        { downDelta = -1;                 newVote = null;   } // toggle off
      }

      const nextVotes = { ...votedTips };
      if (newVote === null) delete nextVotes[tipId];
      else nextVotes[tipId] = newVote;

      const nextTips = tips.map((t) =>
        t.id !== tipId ? t : {
          ...t,
          votes_up:   Math.max(0, t.votes_up   + upDelta),
          votes_down: Math.max(0, t.votes_down + downDelta),
        }
      );

      setVotedTips(nextVotes);
      setTips(nextTips);
      safeSet(LS.votes, nextVotes);
      safeSet(LS.tips, nextTips);
    },
    [tips, votedTips]
  );

  // ── addTip ────────────────────────────────────────────────────────────────
  // returns "limit" if user already hit MAX_TIPS_PER_USER, else "ok"
  const addTip = useCallback(
    (tip: Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">): "ok" | "limit" => {
      if (createdTips.length >= MAX_TIPS_PER_USER) return "limit";

      const newTip: Tip = {
        ...tip,
        id: Date.now().toString(),
        votes_up:   tip.authorResult === "fungovalo"    ? 1 : 0,
        votes_down: tip.authorResult === "nefungovalo"  ? 1 : 0,
        createdAt:  new Date().toISOString().split("T")[0],
      };

      const nextTips    = [newTip, ...tips];
      const nextCreated = [...createdTips, newTip.id];

      setTips(nextTips);
      setCreatedTips(nextCreated);
      safeSet(LS.tips, nextTips);
      safeSet(LS.createdTips, nextCreated);

      return "ok";
    },
    [tips, createdTips]
  );

  const getTip = useCallback(
    (id: string) => tips.find((t) => t.id === id),
    [tips]
  );

  return (
    <TipsContext.Provider
      value={{
        tips,
        votedTips,
        createdTips,
        canAddTip: createdTips.length < MAX_TIPS_PER_USER,
        userId,
        handleVote,
        addTip,
        getTip,
      }}
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
