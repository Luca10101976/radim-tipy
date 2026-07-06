import { supabase } from "./supabaseClient";

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(path, { ...options, headers });
}

export async function apiJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const res = await apiFetch(path, options);
  const body = (await res.json().catch(() => ({}))) as { error?: string };

  if (!res.ok) {
    return {
      ok: false,
      error: body.error ?? "Požadavek selhal.",
      status: res.status,
    };
  }

  return { ok: true, data: body as T };
}
