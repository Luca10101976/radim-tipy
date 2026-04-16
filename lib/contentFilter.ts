const BLOCKED_WORDS = [
  // vulgarity
  "kurva", "pica", "kokot", "zmrd", "debil", "hovno",
  // rasismus
  "negr", "cigan", "buzerant",
  // sexuální
  "porno", "sex", "mrdat",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip diacritics
}

export function containsBlockedContent(text: string): boolean {
  const normalized = normalize(text);
  return BLOCKED_WORDS.some((word) => normalized.includes(word));
}
