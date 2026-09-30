import Lobby from "@/components/lobby";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ sala?: string }>;
}) {
  const { sala } = await searchParams;

  return <Lobby codigoInicial={sala} />;
}
