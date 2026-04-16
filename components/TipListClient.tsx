"use client";

import { useState, useMemo } from "react";
import { useTips } from "@/lib/store";
import { computeStats, CATEGORIES, CATEGORY_TAGS, getTagsForCategory, getAllUniqueTags, Category } from "@/lib/types";
import TipCard from "./TipCard";

type SortKey = "success_rate" | "votes";

export default function TipListClient() {
  const { tips } = useTips();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("success_rate");

  function selectCategory(cat: Category | null) {
    setActiveCategory(cat);
    // Reset tagy, které do nové kategorie nepatří
    if (cat !== null) {
      const allowed = new Set(getTagsForCategory(cat));
      setActiveTags((prev) => prev.filter((t) => allowed.has(t)));
    } else {
      setActiveTags([]);
    }
  }

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  // Tagy viditelné v aktuálním kontextu
  const visibleTags = activeCategory
    ? getTagsForCategory(activeCategory)
    : getAllUniqueTags();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tips
      .map(computeStats)
      .filter((t) => {
        const matchSearch =
          !q ||
          t.title.toLowerCase().includes(q) ||
          t.problem.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchCategory = !activeCategory || t.category === activeCategory;
        const matchTags =
          activeTags.length === 0 ||
          activeTags.every((at) => t.tags.includes(at));
        return matchSearch && matchCategory && matchTags;
      })
      .sort((a, b) => {
        if (sort === "success_rate") return b.success_rate - a.success_rate;
        return b.votes_up + b.votes_down - (a.votes_up + a.votes_down);
      });
  }, [tips, search, activeCategory, activeTags, sort]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Co řešíš? Hledej tip…"
          className="w-full pl-11 pr-4 py-3.5 border border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => selectCategory(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            !activeCategory
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
          }`}
        >
          Vše
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => selectCategory(activeCategory === cat ? null : cat)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              activeCategory === cat
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Contextual tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                activeTags.includes(tag)
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      {activeCategory && (
        <p className="text-xs text-gray-400 mb-4">
          Tagy pro: <span className="font-medium text-gray-500">{activeCategory}</span>
        </p>
      )}
      {!activeCategory && <div className="mb-4" />}

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {filtered.length} {filtered.length === 1 ? "tip" : "tipů"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Řadit:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="success_rate">Úspěšnost</option>
            <option value="votes">Počet hlasů</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🤷</div>
          <p className="text-sm">Žádný tip neodpovídá filtru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </div>
      )}
    </div>
  );
}
