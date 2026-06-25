import { z } from "zod";

export const configuracaoSchema = z.object({
  evolutionApiUrl: z.string().url("URL inválida"),
  evolutionApiKey: z.string().min(1),
  instanceName: z.string().min(1),
  telefoneFinanceiro: z.string().min(10, "Informe o telefone com DDD (ex: 5511999999999)"),
  ativo: z.boolean().optional().default(true),
});

export type ConfiguracaoInput = z.infer<typeof configuracaoSchema>;
