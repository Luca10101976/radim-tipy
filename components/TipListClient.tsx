"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useTips } from "@/lib/store";
import {
  computeStats,
  CATEGORIES,
  getTagsForCategory,
  getAllUniqueTags,
  Category,
} from "@/lib/types";
import TipCard from "./TipCard";
import RadimAvatar from "./RadimAvatar";

type SortKey = "success_rate" | "votes" | "newest";

const RADIM_HINTS = [
  "Zkus to napsat jednoduše. Třeba \u201epračka\u201c.",
  "Tohle už tu někdo řešil.",
  "Zkus to najít, možná už to tu je.",
];

const RADIM_EMPTY = "Tohle by se hodilo vědět.";

export default function TipListClient() {
  const { tips } = useTips();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("success_rate");
  const [hintIndex, setHintIndex] = useState(0);
  useEffect(() => {
    setHintIndex(Math.floor(Math.random() * RADIM_HINTS.length));
  }, []);

  function selectCategory(cat: Category | null) {
    setActiveCategory(cat);
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
        if (sort === "votes") return (b.votes_up + b.votes_down) - (a.votes_up + a.votes_down);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tips, search, activeCategory, activeTags, sort]);

  const isFiltering = search || activeCategory || activeTags.length > 0;

  return (
    <div>
      {/* ── HERO ── */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
          <RadimAvatar size={96} className="flex-shrink-0 drop-shadow-md" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-2">
              Někdo to zkusil před tebou.{" "}
              <span className="text-teal-600">Tady zjistíš, co fungovalo – a co ne.</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Žádné reklamy. Jen zkušenosti lidí z domácnosti.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-xl select-none">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Máš nějakou starost? (např. smrdí pračka, mastnota na digestoři)'
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-teal-400 bg-white shadow-sm transition-colors placeholder:text-gray-300"
          />
        </div>

        {/* Radim search hint */}
        <div className="flex items-center gap-2 mt-2 ml-1">
          <RadimAvatar size={22} className="flex-shrink-0 opacity-80" />
          <p className="text-xs text-gray-400 italic">{RADIM_HINTS[hintIndex]}</p>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => selectCategory(null)}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            !activeCategory
              ? "bg-teal-600 text-white border-teal-600"
              : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
          }`}
        >
          Vše
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => selectCategory(activeCategory === cat ? null : cat)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              activeCategory === cat
                ? "bg-teal-600 text-white border-teal-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── TAGS ── */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {visibleTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                activeTags.includes(tag)
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      {activeCategory && (
        <p className="text-xs text-gray-300 mb-4 ml-1">
          tagy pro: <span className="text-gray-400">{activeCategory}</span>
        </p>
      )}
      {!activeCategory && <div className="mb-4" />}

      {/* ── SORT + COUNT ── */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-400">
          {filtered.length}{" "}
          {filtered.length === 1 ? "tip" : filtered.length < 5 ? "tipy" : "tipů"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Seřadit:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            <option value="success_rate">Nejvíc funguje</option>
            <option value="votes">Nejvíc hlasů</option>
            <option value="newest">Nejnovější</option>
          </select>
        </div>
      </div>

      {/* ── LIST or EMPTY STATE ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="flex justify-center mb-4">
            <RadimAvatar size={72} className="opacity-70" />
          </div>
          <p className="text-xs text-gray-400 italic mb-3">„{RADIM_EMPTY}"</p>
          <p className="text-lg font-semibold text-gray-700 mb-1">Tohle tu ještě není.</p>
          <p className="text-sm text-gray-400 mb-6">
            Přidej zkušenost a pomoz ostatním.
          </p>
          <Link
            href={`/pridat${search ? `?problem=${encodeURIComponent(search)}` : ""}`}
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
          >
            Přidat tip
          </Link>
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
