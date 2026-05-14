import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { TipsProvider } from "@/lib/store";
import AdminBadge from "@/components/AdminBadge";
import HeaderAuth from "@/components/HeaderAuth";
import { Analytics } from "@vercel/analytics/next";
import CookieBanner from "@/components/CookieBanner";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Radim.pro – tebe, když doma nevíš co s problémem",
  description: "Pračka smrdí, vodní kámen, mastnota na digestoři – Radim.pro sbírá domácí tipy ověřené skutečnými lidmi. Víš předem, co funguje a co ne.",
  metadataBase: new URL("https://radim.pro"),
  openGraph: {
    title: "Radim.pro – tebe, když doma nevíš co s problémem",
    description: "Pračka smrdí, vodní kámen, mastnota na digestoři – Radim.pro sbírá domácí tipy ověřené skutečnými lidmi. Víš předem, co funguje a co ne.",
    url: "https://radim.pro",
    siteName: "Radim.pro",
    locale: "cs_CZ",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Radim.pro" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radim.pro – tebe, když doma nevíš co s problémem",
    description: "Pračka smrdí, vodní kámen, mastnota na digestoři – Radim.pro sbírá domácí tipy ověřené skutečnými lidmi. Víš předem, co funguje a co ne.",
    images: ["/og-image.png"],
  },
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
                <Image
                  src="/radim-maskot.png"
                  alt="Radim maskot"
                  width={32}
                  height={32}
                  className="rounded-full"
                  priority
                />
                <span className="text-lg font-bold text-teal-700">Radim</span>
                <span className="text-lg font-bold text-gray-300">.pro</span>
                <span className="text-xs text-gray-400 font-normal pl-1 border-l border-gray-200 ml-0.5 hidden sm:inline">
                  tebe, když nevíš
                </span>
              </Link>
              <div className="flex items-center gap-3">
                <AdminBadge />
                <HeaderAuth />
                <Link
                  href="/pridat"
                  className="text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  <span className="hidden sm:inline">+ Přidat tip</span>
                  <span className="sm:hidden text-base leading-none">+</span>
                </Link>
              </div>
            </div>
          </header>
          <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        </TipsProvider>
        <Analytics />
        <CookieBanner />
      </body>
    </html>
  );
}
