import { z } from "zod";

export const registerSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  cnpj: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
