import Link from "next/link";

export const metadata = {
  title: "Zásady cookies – Radim.pro",
  description: "Informace o používání cookies na webu Radim.pro.",
};

export default function ZasadyCookiesPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1 mb-8 transition-colors">
        ← Zpět
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Zásady cookies</h1>
      <p className="text-sm text-gray-400 mb-8">Platné pro web radim.pro</p>

      <div className="prose prose-sm text-gray-600 space-y-6">

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Co jsou cookies?</h2>
          <p>
            Cookies jsou malé textové soubory ukládané do vašeho prohlížeče. Slouží k tomu,
            aby si web pamatoval vaše nastavení nebo stav přihlášení.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Jaké cookies používáme?</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 border border-gray-200 font-medium text-gray-700">Název</th>
                  <th className="text-left p-3 border border-gray-200 font-medium text-gray-700">Účel</th>
                  <th className="text-left p-3 border border-gray-200 font-medium text-gray-700">Typ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border border-gray-200 font-mono text-xs">sb-*</td>
                  <td className="p-3 border border-gray-200">Přihlášení a session (Supabase Auth)</td>
                  <td className="p-3 border border-gray-200">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Nezbytné</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="p-3 border border-gray-200 font-mono text-xs">cookie-consent</td>
                  <td className="p-3 border border-gray-200">Zapamatování souhlasu s cookies (localStorage)</td>
                  <td className="p-3 border border-gray-200">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Nezbytné</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Analytika</h2>
          <p>
            Používáme <strong>Vercel Analytics</strong> — nástroj, který měří návštěvnost webu
            bez použití cookies a bez ukládání osobních údajů. Nezaznamenává IP adresy ani
            vás nesleduje mezi weby. Je plně v souladu s GDPR.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Reklamní a sledovací cookies</h2>
          <p>
            Na webu radim.pro <strong>nepouž­íváme</strong> žádné reklamní, marketingové
            ani analytické cookies třetích stran (Google Analytics, Facebook Pixel apod.).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Jak cookies vypnout?</h2>
          <p>
            Cookies můžete kdykoli smazat nebo zakázat v nastavení svého prohlížeče.
            Vypnutí nezbytných cookies může způsobit, že přihlášení nebude fungovat správně.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Kontakt</h2>
          <p>
            Máte otázky? Napište nám na{" "}
            <a href="mailto:rady.radim@gmail.com" className="text-teal-600 hover:underline">
              rady.radim@gmail.com
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
