import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { TipsProvider } from "@/lib/store";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Radim – domácí tipy, které fungují",
  description: "Sdílej a ověřuj praktické tipy z domácnosti.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        <TipsProvider>
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-indigo-700">Radim</span>
                <span className="text-xs text-gray-400 hidden sm:block">domácí tipy, které fungují</span>
              </Link>
              <Link
                href="/pridat"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
              >
                + Přidat tip
              </Link>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </TipsProvider>
      </body>
    </html>
  );
}
