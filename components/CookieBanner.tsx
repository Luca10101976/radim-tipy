"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Tento web používá pouze technické cookies nutné pro přihlášení a anonymní analytiku bez sledování.{" "}
          <a href="/zasady-cookies" className="underline hover:text-teal-600 transition-colors">
            Více info
          </a>
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
        >
          Rozumím
        </button>
      </div>
    </div>
  );
}
