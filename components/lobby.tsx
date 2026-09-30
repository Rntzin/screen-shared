"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { gerarCodigo } from "@/lib/gerar-codigo";

export default function Lobby({ codigoInicial }: { codigoInicial?: string }) {
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState(codigoInicial ?? "");
  const router = useRouter();

  // Recupera nome salvo
  useEffect(() => {
    const saved = localStorage.getItem("tela-nome");
    if (saved) setNome(saved);
  }, []);

  function entrar(codigoSala: string) {
    if (!nome.trim()) return;
    if (!codigoSala.trim()) return;
    localStorage.setItem("tela-nome", nome.trim());
    router.push(
      `/sala/${codigoSala.toUpperCase()}?nome=${encodeURIComponent(nome.trim())}`,
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-background-secondary">
        <div className="rounded-t-xl bg-linear-to-b from-primary/10 to-transparent px-6 pt-6 pb-4 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Tela</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compartilhe sua tela com amigos
          </p>
        </div>

        <div className="space-y-4 px-6 pb-6">
          <input
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={30}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-shadow focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <input
            type="text"
            placeholder="Código da sala"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            maxLength={10}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm uppercase text-foreground placeholder-muted-foreground transition-shadow focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <button
            onClick={() => entrar(codigo)}
            disabled={!nome.trim() || !codigo.trim()}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Entrar
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background-secondary px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const novo = gerarCodigo();
              setCodigo(novo);
              entrar(novo);
            }}
            disabled={!nome.trim()}
            className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Criar nova sala
          </button>
        </div>
      </div>
    </div>
  );
}
