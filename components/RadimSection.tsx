import { TipWithStats } from "@/lib/types";

interface Props {
  tip: TipWithStats;
}

// Deterministic pick based on tip id — no hydration issues
function pick(options: string[], seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return options[Math.abs(hash) % options.length];
}

export default function RadimSection({ tip }: Props) {
  const total = tip.votes_up + tip.votes_down;
  const rate = tip.success_rate;

  let message: string;
  let color: string;
  let emoji: string;

  if (total === 0) {
    message = "Zatím nikdo nehlasoval. Buď první!";
    color = "bg-gray-50 border-gray-200 text-gray-600";
    emoji = "🤔";
  } else if (rate > 0.7) {
    message = pick(
      ["Tohle většinou zabere.", "Tohle lidi chválí.", "Tady bych se toho nebál."],
      tip.id
    );
    color = "bg-green-50 border-green-200 text-green-800";
    emoji = "✅";
  } else if (rate >= 0.4) {
    message = pick(
      ["Není to jistota.", "Někomu to funguje, někomu ne."],
      tip.id
    );
    color = "bg-yellow-50 border-yellow-200 text-yellow-800";
    emoji = "⚖️";
  } else {
    message = pick(
      ["Tohle moc nefunguje.", "Zkusil bych něco jiného."],
      tip.id
    );
    color = "bg-red-50 border-red-200 text-red-800";
    emoji = "⚠️";
  }

  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-current flex items-center justify-center font-bold text-base">
          R
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">
            Radim říká:
          </p>
          <p className="font-medium">
            {emoji} {message}
          </p>
        </div>
      </div>
    </div>
  );
}
