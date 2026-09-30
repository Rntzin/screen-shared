"use client";

import { motion } from "framer-motion";

export default function SalaLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mx-auto h-8 w-8 rounded-full border-2 border-muted border-t-primary"
        />
        <p className="text-muted-foreground">Entrando na sala...</p>
      </motion.div>
    </div>
  );
}
