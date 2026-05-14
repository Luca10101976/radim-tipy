export type Category =
  | "Úklid & čištění"
  | "Kuchyně & vaření"
  | "Prádlo & textil"
  | "Koupelna & hygiena"
  | "Domácnost & organizace"
  | "Zahrada & balkon"
  | "Kutilství"
  | "Tvoření & DIY"
  | "Domácí vychytávky"
  | "Zvířata v domácnosti";

export const CATEGORIES: Category[] = [
  "Úklid & čištění",
  "Kuchyně & vaření",
  "Prádlo & textil",
  "Koupelna & hygiena",
  "Domácnost & organizace",
  "Zahrada & balkon",
  "Kutilství",
  "Tvoření & DIY",
  "Domácí vychytávky",
  "Zvířata v domácnosti",
];

export const CATEGORY_TAGS: Record<Category, string[]> = {
  "Úklid & čištění":       ["vodní kámen", "mastnota", "plíseň", "skvrny", "ocet", "jedlá soda", "chemie", "pračka", "trouba"],
  "Kuchyně & vaření":      ["připálené", "rychlé", "zbytky", "skladování", "trouba", "lednice"],
  "Prádlo & textil":       ["skvrny", "zápach", "bílá", "barevné", "sušení", "žehlení"],
  "Koupelna & hygiena":    ["vodní kámen", "plíseň", "zápach", "odpad", "sprcha"],
  "Domácnost & organizace":["úložné prostory", "minimalismus", "pořádek", "krabice", "organizace"],
  "Zahrada & balkon":      ["rostliny", "zalévání", "škůdci", "květiny", "bylinky"],
  "Kutilství":             ["lepení", "těsnění", "oprava", "dveře", "nábytek"],
  "Tvoření & DIY":         ["výroba", "ruční práce", "dekorace", "recyklace", "nápad"],
  "Domácí vychytávky":     ["rychlé řešení", "hack", "šetří čas", "jednoduché"],
  "Zvířata v domácnosti":  ["zápach", "chlupy", "pelíšek", "krmivo", "výcvik"],
};

export function getTagsForCategory(category: Category): string[] {
  return CATEGORY_TAGS[category] ?? [];
}

export function getAllUniqueTags(): string[] {
  return [...new Set(Object.values(CATEGORY_TAGS).flat())].sort();
}

export interface Tip {
  id: string;
  title: string;
  category: Category;
  problem: string;
  solution: string;
  authorResult: "fungovalo" | "nefungovalo";
  warning?: string;
  tags: string[];
  votes_up: number;
  votes_down: number;
  createdAt: string;
  parent_id?: string | null;
  pending?: boolean;
}

export interface TipWithStats extends Tip {
  score: number;
  success_rate: number;
}

export function computeStats(tip: Tip): TipWithStats {
  const total = tip.votes_up + tip.votes_down;
  return {
    ...tip,
    score: tip.votes_up - tip.votes_down,
    success_rate: total === 0 ? 0 : tip.votes_up / total,
  };
}
