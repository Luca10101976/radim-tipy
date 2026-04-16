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

export interface Report {
  tipId: string;
  reason: string;
  createdAt: string;
}

const MAX_TIPS_PER_USER = 5;
// SHA-256 of the admin passphrase — plaintext never stored in bundle
const ADMIN_KEY_HASH = "986a11a5199c373b8c65225513b7bd49d25cb971129f711e35347741262bc90e";

/**
 * localStorage keys
 *
 * "userTips"    – tips added by this device (array of Tip)
 * "voteDeltas"  – cumulative vote changes { tipId: { up, down } }
 * "votes"       – personal votes { tipId: "up"|"down" }
 * "createdTips" – IDs of tips added from this device
 * "userId"      – stable random ID for this device
 * "reports"     – nahlášení { tipId, reason, createdAt }[]
 * "isAdmin"     – "true" if admin unlocked
 */
const LS = {
  userTips:    "userTips",
  voteDeltas:  "voteDeltas",
  votes:       "votes",
  createdTips: "createdTips",
  userId:      "userId",
  reports:     "reports",
  isAdmin:     "isAdmin",
} as const;

function generateUserId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore (private mode / storage quota)
  }
}

/** Apply stored voteDeltas onto a tips array to get persisted vote counts. */
function applyDeltas(
  tips: Tip[],
  deltas: Record<string, { up: number; down: number }>
): Tip[] {
  return tips.map((t) => {
    const d = deltas[t.id];
    if (!d) return t;
    return {
      ...t,
      votes_up:   Math.max(0, t.votes_up   + d.up),
      votes_down: Math.max(0, t.votes_down + d.down),
    };
  });
}

interface TipsContextValue {
  tips: Tip[];
  votedTips: Record<string, VoteType>;
  createdTips: string[];
  canAddTip: boolean;
  userId: string;
  isAdmin: boolean;
  reports: Report[];
  reportedTipIds: Set<string>;
  handleVote: (tipId: string, type: VoteType) => void;
  addTip: (tip: Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">) => "ok" | "limit";
  getTip: (id: string) => Tip | undefined;
  reportTip: (tipId: string, reason: string) => void;
  deleteTip: (tipId: string) => void;
  dismissReport: (tipId: string) => void;
  unlockAdmin: (key: string) => Promise<boolean>;
}

const TipsContext = createContext<TipsContextValue | null>(null);

export function TipsProvider({ children }: { children: React.ReactNode }) {
  const [tips, setTips]               = useState<Tip[]>(MOCK_TIPS);
  const [votedTips, setVotedTips]     = useState<Record<string, VoteType>>({});
  const [voteDeltas, setVoteDeltas]   = useState<Record<string, { up: number; down: number }>>({});
  const [createdTips, setCreatedTips] = useState<string[]>([]);
  const [userId, setUserId]           = useState<string>("");
  const [reports, setReports]         = useState<Report[]>([]);
  const [isAdmin, setIsAdmin]         = useState<boolean>(false);

  useEffect(() => {
    // userId – create once, keep forever
    let uid = localStorage.getItem(LS.userId) ?? "";
    if (!uid) {
      uid = generateUserId();
      safeSet(LS.userId, uid);
    }
    setUserId(uid);

    // user-added tips (separate from mock data, never overwritten by votes)
    let storedUserTips = safeGet<Tip[]>(LS.userTips, []);

    // Migrate from old "radim_tips" key: extract any non-mock tips that were
    // stored there by the previous version of the store.
    if (storedUserTips.length === 0) {
      const mockIds = new Set(MOCK_TIPS.map((t) => t.id));
      const legacyAll = safeGet<Tip[]>("radim_tips", []);
      const legacyUser = legacyAll.filter((t) => !mockIds.has(t.id));
      if (legacyUser.length > 0) {
        storedUserTips = legacyUser;
        safeSet(LS.userTips, legacyUser);
        // also restore createdTips IDs if missing
        const existingCreated = safeGet<string[]>(LS.createdTips, []);
        if (existingCreated.length === 0) {
          const migratedIds = legacyUser.map((t) => t.id);
          safeSet(LS.createdTips, migratedIds);
        }
      }
    }

    // vote deltas – cumulative changes stored per tipId
    const storedDeltas = safeGet<Record<string, { up: number; down: number }>>(LS.voteDeltas, {});

    // personal votes (with legacy migration from old "radim_votes" key)
    let storedVotes = safeGet<Record<string, VoteType>>(LS.votes, {});
    if (!Object.keys(storedVotes).length) {
      const legacy = safeGet<Record<string, VoteType>>("radim_votes", {});
      if (Object.keys(legacy).length) {
        storedVotes = legacy;
        safeSet(LS.votes, legacy);
      }
    }

    // IDs of tips created on this device
    const storedCreated = safeGet<string[]>(LS.createdTips, []);

    // reports + admin
    const storedReports = safeGet<Report[]>(LS.reports, []);
    const storedAdmin = localStorage.getItem(LS.isAdmin) === "true";
    setReports(storedReports);
    setIsAdmin(storedAdmin);

    // Rebuild tip list: user-added first, then MOCK_TIPS, then apply vote deltas
    const base = [...storedUserTips, ...MOCK_TIPS];
    const merged = applyDeltas(base, storedDeltas);

    setTips(merged);
    setVoteDeltas(storedDeltas);
    setVotedTips(storedVotes);
    setCreatedTips(storedCreated);
  }, []);

  // ── handleVote ────────────────────────────────────────────────────────────
  // Updates vote state + deltas only. Never touches userTips.
  const handleVote = useCallback(
    (tipId: string, type: VoteType) => {
      const current = votedTips[tipId] ?? null;

      let upDelta = 0;
      let downDelta = 0;
      let newVote: VoteType | null = null;

      if (type === "up") {
        if (current === null)        { upDelta = 1;                 newVote = "up";   }
        else if (current === "down") { downDelta = -1; upDelta = 1; newVote = "up";   }
        else                         { upDelta = -1;                newVote = null;   }
      } else {
        if (current === null)        { downDelta = 1;                newVote = "down"; }
        else if (current === "up")   { upDelta = -1; downDelta = 1;  newVote = "down"; }
        else                         { downDelta = -1;               newVote = null;   }
      }

      // Update personal vote record
      const nextVotes = { ...votedTips };
      if (newVote === null) delete nextVotes[tipId];
      else nextVotes[tipId] = newVote;

      // Update cumulative deltas (additive, so they compose correctly)
      const prev = voteDeltas[tipId] ?? { up: 0, down: 0 };
      const nextDeltas = {
        ...voteDeltas,
        [tipId]: {
          up:   prev.up   + upDelta,
          down: prev.down + downDelta,
        },
      };

      // Update in-memory tip list
      const nextTips = tips.map((t) =>
        t.id !== tipId ? t : {
          ...t,
          votes_up:   Math.max(0, t.votes_up   + upDelta),
          votes_down: Math.max(0, t.votes_down + downDelta),
        }
      );

      setVotedTips(nextVotes);
      setVoteDeltas(nextDeltas);
      setTips(nextTips);

      // Persist only vote-related keys — never touches userTips
      safeSet(LS.votes, nextVotes);
      safeSet(LS.voteDeltas, nextDeltas);
    },
    [tips, votedTips, voteDeltas]
  );

  // ── addTip ────────────────────────────────────────────────────────────────
  const addTip = useCallback(
    (tip: Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">): "ok" | "limit" => {
      if (createdTips.length >= MAX_TIPS_PER_USER) return "limit";

      const newTip: Tip = {
        ...tip,
        id: Date.now().toString(),
        votes_up:   tip.authorResult === "fungovalo"   ? 1 : 0,
        votes_down: tip.authorResult === "nefungovalo" ? 1 : 0,
        createdAt:  new Date().toISOString().split("T")[0],
      };

      const nextTips    = [newTip, ...tips];
      const nextCreated = [...createdTips, newTip.id];

      // Store user-added tip separately so votes can never overwrite it
      const prevUserTips = safeGet<Tip[]>(LS.userTips, []);
      safeSet(LS.userTips, [newTip, ...prevUserTips]);
      safeSet(LS.createdTips, nextCreated);

      setTips(nextTips);
      setCreatedTips(nextCreated);

      return "ok";
    },
    [tips, createdTips]
  );

  const getTip = useCallback(
    (id: string) => tips.find((t) => t.id === id),
    [tips]
  );

  const reportTip = useCallback(
    (tipId: string, reason: string) => {
      // one report per tip per device
      if (reports.some((r) => r.tipId === tipId)) return;
      const next: Report[] = [
        ...reports,
        { tipId, reason, createdAt: new Date().toISOString() },
      ];
      setReports(next);
      safeSet(LS.reports, next);
    },
    [reports]
  );

  const deleteTip = useCallback(
    (tipId: string) => {
      // remove from in-memory list
      const nextTips = tips.filter((t) => t.id !== tipId);
      setTips(nextTips);
      // remove from userTips storage
      const prevUserTips = safeGet<Tip[]>(LS.userTips, []);
      safeSet(LS.userTips, prevUserTips.filter((t) => t.id !== tipId));
      // remove associated report
      const nextReports = reports.filter((r) => r.tipId !== tipId);
      setReports(nextReports);
      safeSet(LS.reports, nextReports);
    },
    [tips, reports]
  );

  const dismissReport = useCallback(
    (tipId: string) => {
      const next = reports.filter((r) => r.tipId !== tipId);
      setReports(next);
      safeSet(LS.reports, next);
    },
    [reports]
  );

  const unlockAdmin = useCallback(async (key: string): Promise<boolean> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    if (hashHex === ADMIN_KEY_HASH) {
      localStorage.setItem(LS.isAdmin, "true");
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  return (
    <TipsContext.Provider
      value={{
        tips,
        votedTips,
        createdTips,
        canAddTip: createdTips.length < MAX_TIPS_PER_USER,
        userId,
        isAdmin,
        reports,
        reportedTipIds: new Set(reports.map((r) => r.tipId)),
        handleVote,
        addTip,
        getTip,
        reportTip,
        deleteTip,
        dismissReport,
        unlockAdmin,
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
