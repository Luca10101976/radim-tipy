"use client";

import Link from "next/link";
import { useTips } from "@/lib/store";

export default function AdminBadge() {
  const { isAdmin, reports } = useTips();
  if (!isAdmin || reports.length === 0) return null;

  return (
    <Link
      href="/admin"
      className="flex items-center gap-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
    >
      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      {reports.length} nahlášen{reports.length === 1 ? "í" : "í"}
    </Link>
  );
}
