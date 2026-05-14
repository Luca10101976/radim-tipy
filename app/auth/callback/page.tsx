"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Supabase magic link může přijít ve 3 různých formátech:
//   1. ?code=xxx                      — PKCE flow
//   2. #access_token=xxx&refresh...   — implicit flow (auto detect)
//   3. ?token_hash=xxx&type=magiclink — token hash flow (verify OTP)
// Tato stránka zvládne všechny tři.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      try {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash;

        // Debug info pro případ, že nic nefunguje
        const code = params.get("code");
        const tokenHash = params.get("token_hash");
        const type = params.get("type");
        const errParam = params.get("error_description") ?? params.get("error");

        setDebug(`code=${!!code}, token_hash=${!!tokenHash}, type=${type ?? "-"}, hash=${!!hash}`);

        // Pokud Supabase vrátil chybu (např. expirovaný odkaz)
        if (errParam) {
          setError(decodeURIComponent(errParam));
          return;
        }

        // 1. PKCE: ?code=...
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // 2. Token hash: ?token_hash=...&type=...
        else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: type as any,
          });
          if (error) throw error;
        }
        // 3. Implicit: #access_token=... — detectSessionInUrl handle to automaticky

        // Počkat až se session uloží
        for (let i = 0; i < 15; i++) {
          if (cancelled) return;
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            router.replace("/");
            return;
          }
          await new Promise((r) => setTimeout(r, 200));
        }

        if (!cancelled) {
          setError("Nepodařilo se přihlásit. Možná je odkaz starší než hodinu.");
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Neznámá chyba";
        console.error("[auth callback]", e);
        setError(msg);
      }
    }

    handleAuth();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="max-w-sm mx-auto pt-24 text-center">
      {error ? (
        <>
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <p className="text-xs text-gray-400 mb-6 font-mono">{debug}</p>
          <a href="/" className="text-sm text-teal-600 hover:underline">
            ← Zpět na hlavní stránku
          </a>
        </>
      ) : (
        <>
          <p className="text-4xl mb-4">🔐</p>
          <p className="text-sm text-gray-500">Přihlašuji tě…</p>
        </>
      )}
    </div>
  );
}
