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
        const hashStr = window.location.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hashStr);

        // Tokeny mohou být v hashe (implicit flow) NEBO v query (PKCE/OTP)
        const code = params.get("code");
        const tokenHash = params.get("token_hash") ?? hashParams.get("token_hash");
        const type = params.get("type") ?? hashParams.get("type");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const errParam =
          params.get("error_description") ??
          params.get("error") ??
          hashParams.get("error_description") ??
          hashParams.get("error");

        setDebug(
          `code=${!!code}, token_hash=${!!tokenHash}, type=${type ?? "-"}, ` +
          `access=${!!accessToken}, refresh=${!!refreshToken}, hash="${hashStr.slice(0, 60)}"`
        );

        if (errParam) {
          setError(decodeURIComponent(errParam));
          return;
        }

        // 1. PKCE: ?code=...
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // 2. Token hash flow: ?token_hash=...&type=...
        else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: type as any,
          });
          if (error) throw error;
        }
        // 3. Implicit flow: tokeny v hashe — nastav session manualne
        else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

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
