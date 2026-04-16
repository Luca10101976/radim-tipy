import AddTipForm from "@/components/AddTipForm";

export default function PridatPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Přidat tip</h1>
      <p className="text-gray-500 text-sm mb-8">
        Sdílej co ti funguje (nebo nefunguje). Ostatní to pak ověří.
      </p>
      <AddTipForm />
    </div>
  );
}
