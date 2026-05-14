"use client";

import { useState } from "react";
import Link from "next/link";
import { useTips } from "@/lib/store";
import { computeStats, Tip } from "@/lib/types";
import { containsBlockedContent } from "@/lib/contentFilter";
import LoginModal from "./LoginModal";

interface Props {
  parentTip: Tip;
  initialVariants?: Tip[];
}

export default function VariantSection({ parentTip, initialVariants = [] }: Props) {
  const { tips, addTip, user } = useTips();
  const [showForm, setShowForm] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [solution, setSolution] = useState("");
  const [authorResult, setAuthorResult] = useState<"fungovalo" | "nefungovalo">("fungovalo");
  const [warning, setWarning] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ── Variants: tips whose parent_id === parentTip.id ───────────────────────
  // Pokud má store data, použij je, jinak fallback na server-side initialVariants
  const clientVariants = tips.filter((t) => t.parent_id === parentTip.id);
  const variants = clientVariants.length > 0 ? clientVariants : initialVariants;

  function handleAddClick() {
    if (!user) { setLoginOpen(true); return; }
    setShowForm(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Název je povinný.";
    else if (title.length > 80) errs.title = "Max. 80 znaků.";
    if (!solution.trim()) errs.solution = "Řešení je povinné.";
    else if (solution.length > 500) errs.solution = "Max. 500 znaků.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { setLoginOpen(true); return; }

    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const combined = [title, solution, warning].join(" ");
    if (containsBlockedContent(combined)) {
      setErrors({ _blocked: "Tohle sem nepatří. Zkus to napsat jako normální radu." });
      return;
    }

    setSubmitting(true);
    const result = await addTip({
      title: title.trim(),
      category: parentTip.category,
      problem: parentTip.problem,
      solution: solution.trim(),
      authorResult,
      warning: warning.trim() || undefined,
      tags: parentTip.tags,
      parent_id: parentTip.id,
    } as Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">);
    setSubmitting(false);

    if (result === "ok") {
      setTitle("");
      setSolution("");
      setWarning("");
      setAuthorResult("fungovalo");
      setErrors({});
      setShowForm(false);
      setSubmitted(true);
    } else if (result === "auth_required") {
      setLoginOpen(true);
    }
  }

  return (
    <>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

      <section className="border-t border-gray-100 pt-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Další způsoby
            {variants.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
                {variants.length}
              </span>
            )}
          </h2>

          {!showForm && !submitted && (
            <button
              onClick={handleAddClick}
              className="text-xs font-medium text-teal-700 hover:text-teal-900 border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Přidat jiný způsob
            </button>
          )}
          {submitted && (
            <span className="text-xs text-green-600 font-medium">✓ Způsob přidán!</span>
          )}
        </div>

        {/* Variant list */}
        {variants.length > 0 && (
          <div className="space-y-3">
            {variants.map((v) => {
              const vs = computeStats(v);
              const total = vs.votes_up + vs.votes_down;
              return (
                <Link
                  key={v.id}
                  href={`/tip/${v.id}`}
                  className="block bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:bg-teal-50/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-800 group-hover:text-teal-700 transition-colors leading-tight">
                      {v.title}
                    </h3>
                    <span
                      className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                        v.authorResult === "fungovalo"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {v.authorResult === "fungovalo" ? "👍" : "👎"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
                    {v.solution}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-green-600 font-medium">👍 {vs.votes_up}</span>
                    <span>·</span>
                    <span className="text-red-500 font-medium">👎 {vs.votes_down}</span>
                    {total >= 3 && (
                      <>
                        <span>·</span>
                        <span>{Math.round(vs.success_rate * 100)} % funguje</span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {variants.length === 0 && !showForm && (
          <p className="text-xs text-gray-400">
            Zkusil/a jsi to jinak? Přidej svůj způsob.
          </p>
        )}

        {/* Inline form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4"
          >
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Název <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="Krátký název tvého způsobu"
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{title.length}/80</p>
            </div>

            {/* Solution */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Jak jsi to udělal/a? <span className="text-red-400">*</span>
              </label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value.slice(0, 500))}
                placeholder="Popiš svůj postup konkrétně…"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              {errors.solution && <p className="text-red-500 text-xs mt-1">{errors.solution}</p>}
              <p className="text-xs text-gray-400 mt-0.5">{solution.length}/500</p>
            </div>

            {/* Warning */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Varování <span className="text-gray-400 font-normal">(volitelné)</span>
              </label>
              <input
                value={warning}
                onChange={(e) => setWarning(e.target.value.slice(0, 200))}
                placeholder="Na co si dát pozor?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>

            {/* Result */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tobě to…
              </label>
              <div className="flex gap-3">
                {(["fungovalo", "nefungovalo"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAuthorResult(v)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                      authorResult === v
                        ? v === "fungovalo"
                          ? "bg-green-500 text-white border-green-500"
                          : "bg-red-500 text-white border-red-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {v === "fungovalo" ? "👍 Fungovalo" : "👎 Nefungovalo"}
                  </button>
                ))}
              </div>
            </div>

            {errors._blocked && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                {errors._blocked}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {submitting ? "Ukládám…" : "Přidat způsob"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setErrors({}); }}
                className="px-4 py-2.5 border border-gray-300 hover:border-gray-400 text-gray-600 rounded-xl text-sm transition-colors"
              >
                Zrušit
              </button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
