"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { nomeSchema } from "@/lib/schemas";

export default function ModalNome({ codigo }: { codigo: string }) {
  const [nome, setNome] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tela-nome") ?? "";
    }
    return "";
  });
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  function entrar() {
    setErro(null);
    const result = nomeSchema.safeParse(nome);
    if (!result.success) {
      setErro(result.error.issues[0]?.message ?? "Nome inválido");
      return;
    }
    localStorage.setItem("tela-nome", result.data);
    router.replace(
      `/sala/${codigo}?nome=${encodeURIComponent(result.data)}`
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        className="w-full max-w-xs rounded-xl border border-border bg-background-secondary p-6"
      >
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
          onChange={(e) => { setNome(e.target.value); setErro(null); }}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          maxLength={30}
          autoFocus
          className="mt-4 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder-muted-foreground transition-shadow focus:outline-none focus:ring-1 focus:ring-ring"
        />

        <AnimatePresence>
          {erro && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="mt-2 text-xs text-destructive"
            >
              {erro}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={entrar}
          disabled={!nome.trim()}
          className="mt-3 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Entrar
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
