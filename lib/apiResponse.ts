import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonValidationError(error: ZodError) {
  const first = error.issues[0];
  const field = first?.path.join(".") || "_form";
  return NextResponse.json(
    { error: first?.message ?? "Neplatná data.", field },
    { status: 400 }
  );
}

export function jsonRateLimited(retryAfterMs: number) {
  return NextResponse.json(
    { error: "Příliš mnoho požadavků. Zkus to později." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
    }
  );
}
