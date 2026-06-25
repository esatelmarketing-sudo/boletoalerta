import { z } from "zod";

export const boletoSchema = z.object({
  tipo: z.enum(["PAGAR", "RECEBER"]),
  clienteId: z.string().cuid().optional().nullable(),
  descricao: z.string().optional(),
  valor: z.number().positive("Valor deve ser positivo"),
  dataVencimento: z.coerce.date(),
  numeroDocumento: z.string().optional(),
  linhaDigitavel: z.string().optional(),
  nossoNumero: z.string().optional(),
  observacoes: z.string().optional(),
}).refine(
  (d) => !(d.tipo === "RECEBER" && !d.clienteId),
  { message: "Informe o cliente para boletos a RECEBER", path: ["clienteId"] }
);

export const boletoUpdateSchema = boletoSchema.partial().omit({ tipo: true });

export const filtrosSchema = z.object({
  tipo: z.enum(["PAGAR", "RECEBER"]).optional(),
  status: z.enum(["PENDENTE", "PAGO", "VENCIDO", "CANCELADO"]).optional(),
  clienteId: z.string().optional(),
  vencimentoDe: z.coerce.date().optional(),
  vencimentoAte: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type BoletoInput = z.infer<typeof boletoSchema>;
export type BoletoUpdateInput = z.infer<typeof boletoUpdateSchema>;
export type FiltrosInput = z.infer<typeof filtrosSchema>;
