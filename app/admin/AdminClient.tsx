"use client";

import { useState } from "react";
import Link from "next/link";
import { useTips } from "@/lib/store";

export default function AdminClient() {
  const { isAdmin, reports, tips, deleteTip, dismissReport, unlockAdmin } = useTips();
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState(false);

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto pt-24 text-center">
        <p className="text-4xl mb-6">🔐</p>
        <h1 className="text-lg font-semibold text-gray-800 mb-4">Admin přístup</h1>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => { setKeyInput(e.target.value); setError(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (!unlockAdmin(keyInput)) setError(true);
            }
          }}
          placeholder="Zadej přístupový klíč"
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 mb-3"
        />
        {error && <p className="text-red-500 text-xs mb-3">Špatný klíč.</p>}
        <button
          onClick={() => { if (!unlockAdmin(keyInput)) setError(true); }}
          className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Přihlásit se
        </button>
      </div>
    );
  }

  // ── Admin view ────────────────────────────────────────────────────────────
  const reportsWithTips = reports.map((r) => ({
    report: r,
    tip: tips.find((t) => t.id === r.tipId),
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin</h1>
          <p className="text-sm text-gray-400">Nahlášené tipy</p>
        </div>
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Zpět</Link>
      </div>

      {reportsWithTips.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-sm">Žádná nahlášení.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reportsWithTips.map(({ report, tip }) => (
            <div
              key={report.tipId}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              {tip ? (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {tip.category}
                      </span>
                      <h2 className="font-semibold text-gray-900 mt-1">{tip.title}</h2>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(report.createdAt).toLocaleDateString("cs")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Problém:</span> {tip.problem}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Řešení:</span> {tip.solution}
                  </p>
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700 mb-4">
                    <span className="font-medium">Důvod nahlášení:</span> {report.reason}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 mb-4">
                  Tip ID {report.tipId} – již byl smazán nebo nenalezen.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => deleteTip(report.tipId)}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Smazat tip
                </button>
                <button
                  onClick={() => dismissReport(report.tipId)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                >
                  Ignorovat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
