"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { gerarCodigo } from "@/lib/gerar-codigo";

export default function Lobby({ codigoInicial }: { codigoInicial?: string }) {
  const [nome, setNome] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tela-nome") ?? "";
    }
    return "";
  });
  const [codigo, setCodigo] = useState(codigoInicial ?? "");
  const router = useRouter();

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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => entrar(codigo)}
            disabled={!nome.trim() || !codigo.trim()}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Entrar
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
              entrar(novo);
            }}
            disabled={!nome.trim()}
            className="w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Criar nova sala
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
