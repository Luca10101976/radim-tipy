import TipDetailClient from "./TipDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TipPage({ params }: Props) {
  const { id } = await params;
  return <TipDetailClient id={id} />;
}
