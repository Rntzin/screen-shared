"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ModalNome({ codigo }: { codigo: string }) {
  const [nome, setNome] = useState("");
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("tela-nome");
    if (saved) setNome(saved);
  }, []);

  function entrar() {
    if (!nome.trim()) return;
    localStorage.setItem("tela-nome", nome.trim());
    router.replace(
      `/sala/${codigo}?nome=${encodeURIComponent(nome.trim())}`
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xs rounded-xl border border-border bg-background-secondary p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Entrar na sala
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sala <span className="font-mono text-primary">{codigo}</span>
        </p>

        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          maxLength={30}
          autoFocus
          className="mt-4 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-shadow focus:outline-none focus:ring-1 focus:ring-ring"
        />

        <button
          onClick={entrar}
          disabled={!nome.trim()}
          className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Entrar
        </button>
      </div>
    </div>
  );
}
