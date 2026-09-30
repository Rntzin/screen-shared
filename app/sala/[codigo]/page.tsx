import { redirect } from "next/navigation";
import { validarCodigo } from "@/lib/validar-codigo";
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

  if (!validarCodigo(codigo)) {
    redirect("/");
  }

  const codigoUpper = codigo.toUpperCase();

  if (!nome?.trim()) {
    return <ModalNome codigo={codigoUpper} />;
  }

  return <SalaDynamic codigo={codigoUpper} nome={nome.trim()} />;
}
