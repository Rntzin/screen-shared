import { redirect } from "next/navigation";
import { codigoSchema, nomeSchema } from "@/lib/schemas";
import SalaDynamic from "@/components/sala-dynamic";
import ModalNome from "@/components/modal-nome";

export default async function SalaPage({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<{ nome?: string }>;
}) {
  const { codigo } = await params;
  const { nome } = await searchParams;

  const codigoResult = codigoSchema.safeParse(codigo);
  if (!codigoResult.success) {
    redirect("/");
  }

  const codigoLimpo = codigoResult.data;

  const nomeResult = nomeSchema.safeParse(nome ?? "");
  if (!nomeResult.success) {
    return <ModalNome codigo={codigoLimpo} />;
  }

  return <SalaDynamic codigo={codigoLimpo} nome={nomeResult.data} />;
}
