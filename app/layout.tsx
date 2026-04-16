import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { TipsProvider } from "@/lib/store";
import AdminBadge from "@/components/AdminBadge";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Radim.pro – domácí tipy, které fungují",
  description: "Zkušenosti z domácnosti. Zjisti, co ostatním fungovalo – a co ne.",
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
              <Link href="/" className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-teal-700">Radim</span>
                <span className="text-lg font-bold text-gray-300">.pro</span>
              </Link>
              <div className="flex items-center gap-3">
                <AdminBadge />
                <Link
                  href="/pridat"
                  className="text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  + Přidat tip
                </Link>
              </div>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </TipsProvider>
      </body>
    </html>
  );
}
