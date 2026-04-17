"use client";

import Link from "next/link";
import { useTips } from "@/lib/store";
import { useState } from "react";

export default function AdminClient() {
  const { isAdmin, reports, tips, deleteTip, dismissReport, isLoading, user, signIn, signOut } = useTips();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-sm mx-auto pt-24 text-center text-gray-400 text-sm">
        Načítám…
      </div>
    );
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    async function handleLogin(e: React.FormEvent) {
      e.preventDefault();
      if (!email.trim()) return;
      setLoginLoading(true);
      setLoginError(null);
      const result = await signIn(email.trim());
      setLoginLoading(false);
      if (result === "ok") setSent(true);
      else setLoginError(result.replace("error:", ""));
    }

    return (
      <div className="max-w-sm mx-auto pt-24">
        <p className="text-4xl mb-5 text-center">🔐</p>
        <h1 className="text-lg font-semibold text-gray-800 mb-1 text-center">Admin přístup</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">Přihlaš se pomocí e-mailu.</p>

        {sent ? (
          <div className="text-center">
            <p className="text-4xl mb-3">📬</p>
            <p className="text-sm text-gray-600">
              Odkaz jsme poslali na <span className="font-medium">{email}</span>. Klikni na něj a budeš přihlášena.
            </p>
            <Link href="/" className="inline-block mt-5 text-sm text-gray-400 hover:text-gray-600">
              ← Zpět na tipy
            </Link>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tvuj@email.cz"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            {loginError && (
              <p className="text-red-500 text-xs">Chyba: {loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {loginLoading ? "Odesílám…" : "Poslat přihlašovací odkaz"}
            </button>
            <Link
              href="/"
              className="block text-center text-sm text-gray-400 hover:text-gray-600 mt-1"
            >
              ← Zpět na tipy
            </Link>
          </form>
        )}
      </div>
    );
  }

  // ── Logged in but not admin ────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto pt-24 text-center">
        <p className="text-4xl mb-6">🚫</p>
        <h1 className="text-lg font-semibold text-gray-800 mb-2">Nemáš přístup</h1>
        <p className="text-sm text-gray-500 mb-6">
          Tento účet nemá administrátorská práva.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => signOut()}
            className="py-2.5 px-6 border border-gray-300 hover:border-red-300 hover:text-red-500 text-gray-600 rounded-xl text-sm font-medium transition-colors"
          >
            Odhlásit se
          </button>
          <Link
            href="/"
            className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            ← Zpět na tipy
          </Link>
        </div>
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
          <p className="text-sm text-gray-400">
            Nahlášené tipy ({reports.length})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => signOut()}
            className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Odhlásit
          </button>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Zpět</Link>
        </div>
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
