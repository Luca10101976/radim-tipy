"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTips } from "@/lib/store";
import { Category, CATEGORIES, getTagsForCategory, Tip } from "@/lib/types";

export default function AddTipForm() {
  const { addTip } = useTips();
  const router = useRouter();

  const [problem, setProblem] = useState("");
  const [solution, setSolution] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [authorResult, setAuthorResult] = useState<"fungovalo" | "nefungovalo">("fungovalo");
  const [warning, setWarning] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function handleCategoryChange(newCat: Category) {
    setCategory(newCat);
    // Zachovej jen tagy, které platí i v nové kategorii
    const allowed = new Set(getTagsForCategory(newCat));
    setSelectedTags((prev) => prev.filter((t) => allowed.has(t)));
  }

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const t = customTag.trim().toLowerCase();
    if (t && !selectedTags.includes(t)) {
      setSelectedTags((prev) => [...prev, t]);
    }
    setCustomTag("");
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Název je povinný.";
    else if (title.length > 80) errs.title = "Max. 80 znaků.";
    if (!problem.trim()) errs.problem = "Popis problému je povinný.";
    else if (problem.length > 300) errs.problem = "Max. 300 znaků.";
    if (!solution.trim()) errs.solution = "Řešení je povinné.";
    else if (solution.length > 500) errs.solution = "Max. 500 znaků.";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    addTip({
      title: title.trim(),
      category,
      problem: problem.trim(),
      solution: solution.trim(),
      authorResult,
      warning: warning.trim() || undefined,
      tags: selectedTags,
    } as Omit<Tip, "id" | "votes_up" | "votes_down" | "createdAt">);
    setSubmitted(true);
    setTimeout(() => router.push("/"), 1500);
  }

  if (submitted) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-semibold text-gray-800">Tip přidán!</h2>
        <p className="text-gray-500 mt-1">Přesměrovávám na hlavní stránku…</p>
      </div>
    );
  }

  const categoryTags = getTagsForCategory(category);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Název tipu <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Krátký, výstižný název"
          maxLength={80}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        <p className="text-xs text-gray-400 mt-1">{title.length}/80</p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value as Category)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Problem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Problém <span className="text-red-500">*</span>
        </label>
        <textarea
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Co ti dělalo problém?"
          rows={3}
          maxLength={300}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
        {errors.problem && <p className="text-red-500 text-xs mt-1">{errors.problem}</p>}
        <p className="text-xs text-gray-400 mt-1">{problem.length}/300</p>
      </div>

      {/* Solution */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Řešení <span className="text-red-500">*</span>
        </label>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder="Jak přesně jsi to udělal/a? Stručně a konkrétně."
          rows={4}
          maxLength={500}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
        {errors.solution && <p className="text-red-500 text-xs mt-1">{errors.solution}</p>}
        <p className="text-xs text-gray-400 mt-1">{solution.length}/500</p>
      </div>

      {/* Author result */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tobě to…</label>
        <div className="flex gap-3">
          {(["fungovalo", "nefungovalo"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAuthorResult(v)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
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

      {/* Warning */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Varování <span className="text-gray-400">(volitelné)</span>
        </label>
        <input
          value={warning}
          onChange={(e) => setWarning(e.target.value)}
          placeholder="Na co si dát pozor?"
          maxLength={200}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>

      {/* Contextual tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tagy
          <span className="ml-2 text-xs font-normal text-gray-400">pro: {category}</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {categoryTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                selectedTags.includes(tag)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
            placeholder="Vlastní tag…"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
          >
            + Přidat
          </button>
        </div>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="text-indigo-400 hover:text-indigo-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
      >
        Přidat tip
      </button>
    </form>
  );
}
