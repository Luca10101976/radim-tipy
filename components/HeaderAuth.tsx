"use client";

import { useState } from "react";
import { useTips } from "@/lib/store";
import LoginModal from "./LoginModal";

export default function HeaderAuth() {
  const { user, signOut } = useTips();
  const [loginOpen, setLoginOpen] = useState(false);

  if (user) {
    const shortEmail =
      user.email && user.email.length > 18
        ? user.email.slice(0, 15) + "…"
        : user.email ?? "";

    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-xs text-gray-400 max-w-[120px] truncate" title={user.email ?? ""}>
          {shortEmail}
        </span>
        <button
          onClick={() => signOut()}
          className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          Odhlásit
        </button>
      </div>
    );
  }

  return (
    <>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <button
        onClick={() => setLoginOpen(true)}
        className="text-xs text-gray-500 hover:text-teal-700 border border-gray-200 hover:border-teal-300 px-3 py-1.5 rounded-lg transition-colors"
      >
        Přihlásit se
      </button>
    </>
  );
}
