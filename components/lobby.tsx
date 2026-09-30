"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { gerarCodigo } from "@/lib/gerar-codigo";
import { nomeSchema, codigoSchema } from "@/lib/schemas";

export default function Lobby({ codigoInicial }: { codigoInicial?: string }) {
  const [nome, setNome] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tela-nome") ?? "";
    }
    return "";
  });
  const [codigo, setCodigo] = useState(codigoInicial ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar(codigoSala: string, modo: "entrar" | "criar") {
    setErro(null);

    const nomeResult = nomeSchema.safeParse(nome);
    if (!nomeResult.success) {
      setErro(nomeResult.error.issues[0]?.message ?? "Nome inválido");
      return;
    }

    const codigoResult = codigoSchema.safeParse(codigoSala);
    if (!codigoResult.success) {
      setErro(codigoResult.error.issues[0]?.message ?? "Código inválido");
      return;
    }

    const codigoLimpo = codigoResult.data;
    const nomeLimpo = nomeResult.data;

    setCarregando(true);
    try {
      const res = await fetch("/api/sala/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: codigoLimpo, modo }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErro(data.error ?? "Erro ao verificar sala");
        return;
      }

      localStorage.setItem("tela-nome", nomeLimpo);
      router.push(
        `/sala/${codigoLimpo}?nome=${encodeURIComponent(nomeLimpo)}`
      );
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm rounded-xl border border-border bg-background-secondary"
      >
        <div className="rounded-t-xl bg-linear-to-b from-primary/10 to-transparent px-6 pt-6 pb-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="text-2xl font-semibold text-foreground"
          >
            Tela
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="mt-1 text-sm text-muted-foreground"
          >
            Compartilhe sua tela com amigos
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="space-y-4 px-6 pb-6"
        >
          <input
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => { setNome(e.target.value); setErro(null); }}
            maxLength={30}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-shadow focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <input
            type="text"
            placeholder="Código da sala"
            value={codigo}
            onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setErro(null); }}
            maxLength={10}
            className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm uppercase text-foreground placeholder-muted-foreground transition-shadow focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <AnimatePresence>
            {erro && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs text-destructive"
              >
                {erro}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => entrar(codigo, "entrar")}
            disabled={!nome.trim() || !codigo.trim() || carregando}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {carregando ? "Verificando..." : "Entrar"}
          </motion.button>

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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const novo = gerarCodigo();
              setCodigo(novo);
              entrar(novo, "criar");
            }}
            disabled={!nome.trim() || carregando}
            className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {carregando ? "Criando..." : "Criar nova sala"}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
