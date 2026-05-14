"use client";

import Link from "next/link";
import { useTips } from "@/lib/store";

export default function AdminBadge() {
  const { isAdmin, reports, pendingTips } = useTips();
  if (!isAdmin) return null;

  const reportCount = reports.length;
  const pendingCount = pendingTips.length;
  const total = reportCount + pendingCount;

  if (total === 0) {
    // Klidný stav — žádné akce ke schválení, jen tichá ikona ke vstupu do adminu
    return (
      <Link
        href="/mozek"
        title="Admin (žádné nové akce)"
        className="flex items-center justify-center w-8 h-8 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
      >
        🔔
      </Link>
    );
  }

  // Sestavit popisek
  const parts: string[] = [];
  if (pendingCount > 0) parts.push(`${pendingCount} ke schválení`);
  if (reportCount > 0) parts.push(`${reportCount} ${reportCount === 1 ? "nahlášení" : "nahlášení"}`);
  const label = parts.join(" · ");

  // Barva podle priority — nahlášení mají přednost (červené)
  const isUrgent = reportCount > 0;
  const colors = isUrgent
    ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
    : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
  const dotColor = isUrgent ? "bg-red-500" : "bg-amber-500";

  return (
    <Link
      href="/mozek"
      title={label}
      className={`relative flex items-center gap-1.5 text-xs font-medium border px-3 py-1.5 rounded-full transition-colors ${colors}`}
    >
      <span className="relative flex h-2 w-2">
        <span className={`absolute inset-0 ${dotColor} rounded-full animate-ping opacity-60`} />
        <span className={`relative ${dotColor} rounded-full w-2 h-2`} />
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden font-semibold">{total}</span>
    </Link>
  );
}
