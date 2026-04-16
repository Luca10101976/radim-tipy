"use client";

import { useState, useEffect } from "react";
import { useTips } from "@/lib/store";

interface Props {
  tipId: string;
}

export default function ReportButton({ tipId }: Props) {
  const { reportTip, reports } = useTips();
  const alreadyReported = reports.some((r) => r.tipId === tipId);
  const [done, setDone] = useState(false);
  const [open, setOpen] = useState(false);

  // Sync with context after localStorage hydration
  useEffect(() => {
    if (alreadyReported) setDone(true);
  }, [alreadyReported]);

  function submit(reason: string) {
    if (alreadyReported) { setDone(true); return; } // guard against stale state
    reportTip(tipId, reason);
    setDone(true);
    setOpen(false);
  }

  if (done) {
    return (
      <p className="text-xs text-gray-400 text-center mt-2">
        Nahlášeno. Díky za upozornění.
      </p>
    );
  }

  return (
    <div className="mt-2 text-center">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors underline underline-offset-2"
        >
          Nahlásit tip
        </button>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left">
          <p className="text-xs font-medium text-gray-600 mb-3">Proč chceš nahlásit tento tip?</p>
          <div className="flex flex-col gap-2">
            {[
              "Nevhodný nebo urážlivý obsah",
              "Nebezpečný postup",
              "Spam nebo nesmysl",
              "Jiný důvod",
            ].map((reason) => (
              <button
                key={reason}
                onClick={() => submit(reason)}
                className="text-xs text-left px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 transition-all"
              >
                {reason}
              </button>
            ))}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="mt-3 text-xs text-gray-400 hover:text-gray-600"
          >
            Zrušit
          </button>
        </div>
      )}
    </div>
  );
}
