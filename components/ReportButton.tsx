"use client";

import { useState } from "react";
import { useTips } from "@/lib/store";
import LoginModal from "./LoginModal";

interface Props {
  tipId: string;
}

export default function ReportButton({ tipId }: Props) {
  const { reportTip, reportedTipIds, user } = useTips();
  const alreadyReported = reportedTipIds.has(tipId);
  const [done, setDone] = useState(alreadyReported);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  async function submit(reason: string) {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    await reportTip(tipId, reason);
    setDone(true);
    setOpen(false);
  }

  function handleOpenReport() {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    setOpen(true);
  }

  if (done) {
    return (
      <p className="text-xs text-gray-400 text-center mt-2">
        Nahlášeno. Díky za upozornění.
      </p>
    );
  }

  return (
    <>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <div className="mt-2 text-center">
        {!open ? (
          <button
            onClick={handleOpenReport}
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
    </>
  );
}
