"use client";

import dynamic from "next/dynamic";
import SalaLoading from "./sala-loading";

const SalaClient = dynamic(() => import("./sala-client"), {
  ssr: false,
  loading: () => <SalaLoading />,
});

export default function SalaDynamic({
  codigo,
  nome,
}: {
  codigo: string;
  nome: string;
}) {
  return <SalaClient codigo={codigo} nome={nome} />;
}
