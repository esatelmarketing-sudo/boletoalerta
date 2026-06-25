import { z } from "zod";

export const clienteSchema = z.object({
  nome: z.string().min(2),
  cpfCnpj: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().min(10, "Informe o telefone com DDD (ex: 5511999999999)"),
});

export const clienteUpdateSchema = clienteSchema.partial();

export type ClienteInput = z.infer<typeof clienteSchema>;
export type ClienteUpdateInput = z.infer<typeof clienteUpdateSchema>;
