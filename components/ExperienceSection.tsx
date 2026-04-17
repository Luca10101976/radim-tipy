"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Experience {
  id: string;
  solution: string;
  result: "fungovalo" | "nefungovalo";
  created_at: string;
}

interface Props {
  tipId: string;
}

const MAX_LEN = 200;

export default function ExperienceSection({ tipId }: Props) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("experiences")
      .select("id, solution, result, created_at")
      .eq("tip_id", tipId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { setLoadError(true); return; }
        setExperiences((data ?? []) as Experience[]);
      });
  }, [tipId]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(result: "fungovalo" | "nefungovalo") {
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("experiences")
      .insert({ tip_id: tipId, solution: trimmed, result })
      .select("id, solution, result, created_at")
      .single();

    setSubmitting(false);
    if (error || !data) return;

    setExperiences((prev) => [data as Experience, ...prev]);
    setText("");
    setShowForm(false);
    setSubmitted(true);
    setExpanded(true);
  }

  const count = experiences.length;

  return (
    <section className="border-t border-gray-100 pt-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => count > 0 && setExpanded((v) => !v)}
          className={`flex items-center gap-2 text-sm font-semibold text-gray-700 ${
            count > 0 ? "hover:text-teal-700 transition-colors" : "cursor-default"
          }`}
        >
          Zkušenosti ostatních
          {count > 0 && (
            <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
          {count > 0 && (
            <span className="text-gray-400 text-xs">{expanded ? "▲" : "▼"}</span>
          )}
        </button>

        {!showForm && !submitted && (
          <button
            onClick={() => { setShowForm(true); setSubmitted(false); }}
            className="text-xs font-medium text-teal-700 hover:text-teal-900 border border-teal-200 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            + Přidat svou zkušenost
          </button>
        )}

        {submitted && (
          <span className="text-xs text-green-600 font-medium">
            ✓ Díky za zkušenost!
          </span>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Co jsi udělal/a jinak?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            placeholder="Popiš svůj postup nebo výsledek…"
            rows={3}
            autoFocus
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{text.length}/{MAX_LEN}</span>
            <button
              onClick={() => { setShowForm(false); setText(""); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Zrušit
            </button>
          </div>

          <div className="flex gap-3">
            <button
              disabled={!text.trim() || submitting}
              onClick={() => handleSubmit("fungovalo")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              👍 Fungovalo mi
            </button>
            <button
              disabled={!text.trim() || submitting}
              onClick={() => handleSubmit("nefungovalo")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              👎 Nefungovalo mi
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {expanded && count > 0 && (
        <ul className="space-y-2">
          {experiences.map((exp) => (
            <li
              key={exp.id}
              className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3"
            >
              <span className="text-base mt-0.5 flex-shrink-0">
                {exp.result === "fungovalo" ? "👍" : "👎"}
              </span>
              <p className="text-sm text-gray-700 leading-relaxed">{exp.solution}</p>
            </li>
          ))}
        </ul>
      )}

      {count === 0 && !showForm && (
        <p className="text-xs text-gray-400">Zatím žádné zkušenosti. Buď první!</p>
      )}

      {loadError && (
        <p className="text-xs text-red-400">Nepodařilo se načíst zkušenosti.</p>
      )}
    </section>
  );
}
