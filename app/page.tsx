import TipListClient from "@/components/TipListClient";

export default function HomePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Domácí tipy, které fungují (nebo ne)
        </h1>
        <p className="text-gray-500 text-sm">
          Zkus tip v reálném světě a hlasuj. Ostatní uvidí, kolik lidem to pomohlo.
        </p>
      </div>
      <TipListClient />
    </div>
  );
}
