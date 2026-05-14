"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Klientský callback po kliknutí na magic link.
// Magic link vrací tokeny dvěma způsoby:
//  - V URL hashe (#access_token=...&refresh_token=...) — implicit flow
//  - V query parametru (?code=...) — PKCE flow
// Oba musíme zpracovat klientsky, jinak se session ztratí.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function handleAuth() {
      try {
        // 1. PKCE flow: ?code=... → vyměnit za session
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // 2. Implicit flow: tokeny v hashe — Supabase je přečte automaticky
        // (detectSessionInUrl: true je default). Ale je dobré počkat na sesssion.
        // Krátký retry — někdy trvá pár ms než se session zapíše do storage.
        for (let i = 0; i < 10; i++) {
          if (cancelled) return;
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            // Přihlášeno → přesměrovat
            router.replace("/");
            return;
          }
          await new Promise((r) => setTimeout(r, 200));
        }

        // Po 2s nic nemáme — něco je špatně
        if (!cancelled) setError("Nepodařilo se přihlásit. Zkus to znovu.");
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
          <p className="text-sm text-red-600 mb-4">{error}</p>
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
