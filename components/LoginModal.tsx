"use client";

import { useState } from "react";
import { useTips } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: Props) {
  const { signIn } = useTips();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const result = await signIn(email.trim());
    setLoading(false);
    if (result === "ok") {
      setSent(true);
    } else {
      setError(result.replace("error:", ""));
    }
  }

  function handleClose() {
    setSent(false);
    setError(null);
    setEmail("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Zkontroluj email
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Poslali jsme ti odkaz na <span className="font-medium text-gray-700">{email}</span>.
              Klikni na něj a budeš přihlášen/a.
            </p>
            <button
              onClick={handleClose}
              className="mt-5 w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Zavřít
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Přihlásit se
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Zadej svůj email a pošleme ti odkaz pro přihlášení.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tvuj@email.cz"
                required
                autoFocus
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              {error && (
                <p className="text-red-500 text-xs">
                  Chyba: {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? "Odesílám…" : "Poslat odkaz"}
              </button>
            </form>
            <button
              onClick={handleClose}
              className="mt-3 w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Zrušit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
