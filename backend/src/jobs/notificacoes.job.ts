import cron from "node-cron";
import { prisma } from "../lib/prisma";
import {
  enviarNotificacao,
  montarMensagemPagar,
  montarMensagemReceber,
} from "../services/whatsapp.service";

// Executa todo dia às 08:00
export function iniciarJobNotificacoes() {
  cron.schedule("0 8 * * *", processarLembretes, { timezone: "America/Sao_Paulo" });
  console.log("[job] Agendamento de notificações ativo (08:00 BRT)");
}

async function processarLembretes() {
  console.log("[job] Iniciando processamento de lembretes:", new Date().toISOString());

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const em5Dias = new Date(hoje);
  em5Dias.setDate(em5Dias.getDate() + 5);
  em5Dias.setHours(23, 59, 59, 999);

  // Busca todos os boletos PENDENTE vencendo em exatamente 5 dias
  // que ainda não receberam o lembrete LEMBRETE_5_DIAS
  const boletos = await prisma.boleto.findMany({
    where: {
      status: "PENDENTE",
      dataVencimento: { gte: em5Dias, lte: em5Dias },
      notificacoes: {
        none: { tipo: "LEMBRETE_5_DIAS", status: "ENVIADO" },
      },
    },
    include: {
      cliente: { select: { nome: true, telefone: true } },
      empresa: {
        include: { configuracao: true },
      },
    },
  });

  console.log(`[job] ${boletos.length} boleto(s) para notificar`);

  for (const boleto of boletos) {
    const config = boleto.empresa.configuracao;

    if (!config?.ativo) {
      console.warn(`[job] Empresa ${boleto.empresaId} sem configuração WhatsApp ativa — pulando`);
      continue;
    }

    const ehPagar = boleto.tipo === "PAGAR";
    const telefone = ehPagar ? config.telefoneFinanceiro : boleto.cliente?.telefone;

    if (!telefone) {
      console.warn(`[job] Boleto ${boleto.id} sem telefone destino — pulando`);
      continue;
    }

    const mensagem = ehPagar
      ? montarMensagemPagar({
          descricao: boleto.descricao,
          valor: boleto.valor.toNumber(),
          dataVencimento: boleto.dataVencimento,
          linhaDigitavel: boleto.linhaDigitavel,
        })
      : montarMensagemReceber({
          nomeCliente: boleto.cliente!.nome,
          descricao: boleto.descricao,
          valor: boleto.valor.toNumber(),
          dataVencimento: boleto.dataVencimento,
          linhaDigitavel: boleto.linhaDigitavel,
        });

    // Cria registro da notificação antes de enviar
    const notificacao = await prisma.notificacao.create({
      data: {
        boletoId: boleto.id,
        tipo: "LEMBRETE_5_DIAS",
        status: "PENDENTE",
        telefone,
        mensagem,
      },
    });

    try {
      await enviarNotificacao(config, telefone, mensagem);
      await prisma.notificacao.update({
        where: { id: notificacao.id },
        data: { status: "ENVIADO", enviadoEm: new Date(), tentativas: 1 },
      });
      console.log(`[job] ✓ Boleto ${boleto.id} → ${telefone}`);
    } catch (err: any) {
      await prisma.notificacao.update({
        where: { id: notificacao.id },
        data: { status: "FALHOU", erro: err.message, tentativas: 1 },
      });
      console.error(`[job] ✗ Boleto ${boleto.id}: ${err.message}`);
    }
  }

  console.log("[job] Processamento finalizado");
}

// Exporta para poder disparar manualmente via endpoint (útil para testes)
export { processarLembretes };
