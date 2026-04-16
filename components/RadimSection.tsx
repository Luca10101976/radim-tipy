import { TipWithStats } from "@/lib/types";

interface Props {
  tip: TipWithStats;
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
    message = "Tohle většinou funguje.";
    color = "bg-green-50 border-green-200 text-green-800";
    emoji = "✅";
  } else if (rate >= 0.4) {
    message = "Někomu to funguje, někomu ne. Záleží na situaci.";
    color = "bg-yellow-50 border-yellow-200 text-yellow-800";
    emoji = "⚖️";
  } else {
    message = "Tohle moc nefunguje, zvaž jiný postup.";
    color = "bg-red-50 border-red-200 text-red-800";
    emoji = "⚠️";
  }

  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-current flex items-center justify-center text-lg">
          R
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-60 mb-1">
            Radim říká:
          </p>
          <p className="font-medium">
            {emoji} {message}
          </p>
          {tip.warning && (
            <p className="mt-2 text-sm">
              <span className="font-semibold">Bacha na:</span> {tip.warning}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
