"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { Tip, Category } from "./types";

export type VoteType = "up" | "down";

export interface Report {
  id: string;
  tipId: string;
  reason: string;
  createdAt: string;
}

function mapTip(row: Record<string, unknown>): Tip {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as Category,
    problem: row.problem as string,
    solution: row.solution as string,
    authorResult: row.author_result as "fungovalo" | "nefungovalo",
    warning: (row.warning as string) ?? undefined,
    tags: (row.tags as string[]) ?? [],
    votes_up: (row.votes_up as number) ?? 0,
    votes_down: (row.votes_down as number) ?? 0,
    createdAt: (row.created_at as string)?.split("T")[0] ?? "",
    parent_id: (row.parent_id as string) ?? null,
    pending: (row.pending as boolean) ?? false,
  };
}

interface TipsContextValue {
  tips: Tip[];
  pendingTips: Tip[];
  votedTips: Record<string, VoteType>;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  reports: Report[];
  reportedTipIds: Set<string>;
  /** Tipy nahlášené uživatelem v aktuální session (lokální stav, bez DB) */
  localReportedIds: Set<string>;
  handleVote: (tipId: string, type: VoteType) => Promise<void>;
  addTip: (
    tip: Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">
  ) => Promise<"ok" | "auth_required">;
  getTip: (id: string) => Tip | undefined;
  reportTip: (tipId: string, reason: string) => Promise<void>;
  deleteTip: (tipId: string) => Promise<void>;
  deleteAllTips: () => Promise<void>;
  approveTip: (tipId: string) => Promise<void>;
  dismissReport: (tipId: string) => Promise<void>;
  refreshAdmin: () => Promise<void>;
  signIn: (email: string) => Promise<string>;
  signOut: () => Promise<void>;
}

const TipsContext = createContext<TipsContextValue | null>(null);

export function TipsProvider({ children }: { children: React.ReactNode }) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [pendingTips, setPendingTips] = useState<Tip[]>([]);
  const [votedTips, setVotedTips] = useState<Record<string, VoteType>>({});
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [localReportedIds, setLocalReportedIds] = useState<Set<string>>(new Set());

  const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "").trim();
  const isAdmin = !!user && !!ADMIN_EMAIL && (user.email ?? "").trim() === ADMIN_EMAIL;

  // ── load tips (schválené, viditelné) ─────────────────────────────────────
  const loadTips = useCallback(async () => {
    const { data } = await supabase
      .from("tips")
      .select("*")
      .eq("hidden", false)
      .eq("pending", false)
      .order("created_at", { ascending: false });
    if (data) setTips(data.map((r) => mapTip(r as Record<string, unknown>)));
  }, []);

  // ── load pending tips (admin only) ───────────────────────────────────────
  const loadPendingTips = useCallback(async () => {
    const { data } = await supabase
      .from("tips")
      .select("*")
      .eq("pending", true)
      .order("created_at", { ascending: false });
    if (data) setPendingTips(data.map((r) => mapTip(r as Record<string, unknown>)));
  }, []);

  // ── load votes for user ──────────────────────────────────────────────────
  const loadVotes = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("votes")
      .select("tip_id, vote_type")
      .eq("user_id", userId);
    if (data) {
      const map: Record<string, VoteType> = {};
      for (const row of data) {
        map[row.tip_id as string] = row.vote_type as VoteType;
      }
      setVotedTips(map);
    }
  }, []);

  // ── load reports (admin only) ────────────────────────────────────────────
  const loadReports = useCallback(async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setReports(
        data.map((r) => ({
          id: r.id as string,
          tipId: r.tip_id as string,
          reason: r.reason as string,
          createdAt: r.created_at as string,
        }))
      );
    }
  }, []);

  // ── init: auth state listener ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function init() {
      const safetyTimer = setTimeout(() => {
        if (mounted) setIsLoading(false);
      }, 6000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        if (process.env.NODE_ENV === "development") console.log("[auth] user:", currentUser?.email ?? "none");
        if (mounted) setUser(currentUser);
        await loadTips();
        if (currentUser) {
          await loadVotes(currentUser.id);
          const adminEmail = ADMIN_EMAIL;
          if (currentUser.email === adminEmail) {
            await loadReports();
            await loadPendingTips();
          }
        }
      } catch (e) {
        console.error("[init error]", e);
      } finally {
        clearTimeout(safetyTimer);
        if (mounted) setIsLoading(false);
      }
    }

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const newUser = session?.user ?? null;
        if (mounted) setUser(newUser);
        if (newUser) {
          await loadVotes(newUser.id);
          const adminEmail = ADMIN_EMAIL;
          if (newUser.email === adminEmail) {
            await loadReports();
            await loadPendingTips();
          }
        } else {
          setVotedTips({});
          setReports([]);
          setPendingTips([]);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadTips, loadVotes, loadReports, loadPendingTips]);

  // ── handleVote ────────────────────────────────────────────────────────────
  const handleVote = useCallback(
    async (tipId: string, type: VoteType) => {
      if (!user) return;

      const current = votedTips[tipId] ?? null;
      const isToggleOff = current === type;

      if (isToggleOff) {
        await supabase
          .from("votes")
          .delete()
          .eq("tip_id", tipId)
          .eq("user_id", user.id);

        const nextVoted = { ...votedTips };
        delete nextVoted[tipId];
        setVotedTips(nextVoted);
      } else {
        await supabase.from("votes").upsert(
          { tip_id: tipId, user_id: user.id, vote_type: type },
          { onConflict: "tip_id,user_id" }
        );

        setVotedTips({ ...votedTips, [tipId]: type });
      }

      const { data: votesData } = await supabase
        .from("votes")
        .select("vote_type")
        .eq("tip_id", tipId);

      if (votesData) {
        const votes_up = votesData.filter((v) => v.vote_type === "up").length;
        const votes_down = votesData.filter((v) => v.vote_type === "down").length;

        await supabase
          .from("tips")
          .update({ votes_up, votes_down })
          .eq("id", tipId);

        setTips((prev) =>
          prev.map((t) => t.id === tipId ? { ...t, votes_up, votes_down } : t)
        );
      }
    },
    [user, votedTips]
  );

  // ── addTip ────────────────────────────────────────────────────────────────
  const addTip = useCallback(
    async (
      tip: Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">
    ): Promise<"ok" | "auth_required"> => {
      if (!user) return "auth_required";

      const { error } = await supabase
        .from("tips")
        .insert({
          title: tip.title,
          category: tip.category,
          problem: tip.problem,
          solution: tip.solution,
          author_result: tip.authorResult,
          warning: tip.warning ?? null,
          tags: tip.tags,
          votes_up: tip.authorResult === "fungovalo" ? 1 : 0,
          votes_down: tip.authorResult === "nefungovalo" ? 1 : 0,
          user_id: user.id,
          hidden: false,
          pending: true, // čeká na schválení adminem
          parent_id: tip.parent_id ?? null,
        });

      if (error) return "auth_required";
      // Tip nejde do lokálního stavu — je pending, admin ho schválí
      return "ok";
    },
    [user]
  );

  // ── getTip ────────────────────────────────────────────────────────────────
  const getTip = useCallback(
    (id: string) => tips.find((t) => t.id === id),
    [tips]
  );

  // ── reportTip ─────────────────────────────────────────────────────────────
  const reportTip = useCallback(
    async (tipId: string, reason: string) => {
      if (!user) return;

      await supabase.from("reports").upsert(
        { tip_id: tipId, user_id: user.id, reason },
        { onConflict: "tip_id,user_id" }
      );

      setLocalReportedIds((prev) => new Set([...prev, tipId]));
    },
    [user]
  );

  // ── deleteTip ─────────────────────────────────────────────────────────────
  const deleteTip = useCallback(
    async (tipId: string) => {
      if (!isAdmin) return;
      await supabase.from("tips").delete().eq("id", tipId);
      // Načíst znovu z DB aby stav odpovídal realitě
      await loadTips();
      setPendingTips((prev) => prev.filter((t) => t.id !== tipId));
      setReports((prev) => prev.filter((r) => r.tipId !== tipId));
    },
    [isAdmin, loadTips]
  );

  // ── deleteAllTips ─────────────────────────────────────────────────────────
  const deleteAllTips = useCallback(async () => {
    if (!isAdmin) return;
    await supabase.from("tips").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setTips([]);
    setPendingTips([]);
    setReports([]);
  }, [isAdmin]);

  // ── approveTip ────────────────────────────────────────────────────────────
  const approveTip = useCallback(
    async (tipId: string) => {
      if (!isAdmin) return;
      await supabase.from("tips").update({ pending: false }).eq("id", tipId);
      const tip = pendingTips.find((t) => t.id === tipId);
      if (tip) {
        setTips((prev) => [{ ...tip, pending: false }, ...prev]);
        setPendingTips((prev) => prev.filter((t) => t.id !== tipId));
      }
    },
    [isAdmin, pendingTips]
  );

  // ── dismissReport ─────────────────────────────────────────────────────────
  const dismissReport = useCallback(
    async (tipId: string) => {
      if (!isAdmin) return;
      await supabase.from("reports").delete().eq("tip_id", tipId);
      await supabase.from("tips").update({ hidden: false }).eq("id", tipId);
      setReports((prev) => prev.filter((r) => r.tipId !== tipId));
    },
    [isAdmin]
  );

  // ── refreshAdmin ──────────────────────────────────────────────────────────
  const refreshAdmin = useCallback(async () => {
    if (!isAdmin) return;
    await Promise.all([loadTips(), loadReports(), loadPendingTips()]);
  }, [isAdmin, loadTips, loadReports, loadPendingTips]);

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string): Promise<string> => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`
              : undefined,
        },
      });
      if (error) console.error("[signIn error]", error.message, error.status, error.code);
      return error ? `error:${error.message}` : "ok";
    },
    []
  );

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setVotedTips({});
    setReports([]);
    setPendingTips([]);
    if (typeof window !== "undefined") window.location.reload();
  }, []);

  return (
    <TipsContext.Provider
      value={{
        tips,
        pendingTips,
        votedTips,
        user,
        isAdmin,
        isLoading,
        reports,
        reportedTipIds: new Set(reports.map((r) => r.tipId)),
        localReportedIds,
        handleVote,
        addTip,
        getTip,
        reportTip,
        deleteTip,
        deleteAllTips,
        approveTip,
        dismissReport,
        refreshAdmin,
        signIn,
        signOut,
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
