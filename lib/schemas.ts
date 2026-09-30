import { z } from "zod";

export const nomeSchema = z
  .string()
  .trim()
  .min(1, "Nome é obrigatório")
  .max(30, "Nome pode ter no máximo 30 caracteres");

export const codigoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Código da sala é obrigatório")
  .max(10, "Código pode ter no máximo 10 caracteres")
  .regex(/^[A-Z0-9]{1,10}$/, "Código deve conter apenas letras e números");

export const tokenRequestSchema = z.object({
  room: codigoSchema,
  username: nomeSchema,
});

export const checkSalaSchema = z.object({
  codigo: codigoSchema,
  modo: z.enum(["entrar", "criar"]),
});

export type TokenRequest = z.infer<typeof tokenRequestSchema>;
export type CheckSalaRequest = z.infer<typeof checkSalaSchema>;
