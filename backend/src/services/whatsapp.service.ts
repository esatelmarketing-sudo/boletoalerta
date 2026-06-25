import axios from "axios";
import { ConfiguracaoWpp } from "@prisma/client";

export async function enviarNotificacao(
  config: ConfiguracaoWpp,
  telefone: string,
  mensagem: string
) {
  await axios.post(
    `${config.evolutionApiUrl}/message/sendText/${config.instanceName}`,
    { number: telefone, text: mensagem },
    {
      headers: { apikey: config.evolutionApiKey },
      timeout: 10_000,
    }
  );
}

export function montarMensagemPagar(params: {
  descricao?: string | null;
  valor: number | string;
  dataVencimento: Date;
  linhaDigitavel?: string | null;
}) {
  const valor = Number(params.valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const vencimento = params.dataVencimento.toLocaleDateString("pt-BR");

  return [
    `🔔 *Lembrete Financeiro — Boleto a Pagar*`,
    ``,
    params.descricao ? `📋 *Descrição:* ${params.descricao}` : null,
    `💰 *Valor:* ${valor}`,
    `📅 *Vencimento:* ${vencimento}`,
    params.linhaDigitavel ? `\n🔢 *Linha digitável:*\n${params.linhaDigitavel}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function montarMensagemReceber(params: {
  nomeCliente: string;
  descricao?: string | null;
  valor: number | string;
  dataVencimento: Date;
  linhaDigitavel?: string | null;
}) {
  const valor = Number(params.valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const vencimento = params.dataVencimento.toLocaleDateString("pt-BR");

  return [
    `Olá, *${params.nomeCliente}*! 👋`,
    ``,
    `Você tem um boleto vencendo em *5 dias*.`,
    ``,
    params.descricao ? `📋 *Descrição:* ${params.descricao}` : null,
    `💰 *Valor:* ${valor}`,
    `📅 *Vencimento:* ${vencimento}`,
    params.linhaDigitavel ? `\n🔢 *Linha digitável:*\n${params.linhaDigitavel}` : null,
    `\nEm caso de dúvidas, entre em contato conosco.`,
  ]
    .filter(Boolean)
    .join("\n");
}
