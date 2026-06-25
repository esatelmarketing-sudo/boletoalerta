import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { enviarNotificacao } from "../../services/whatsapp.service";

export async function listar(req: Request, res: Response) {
  const { boletoId, status } = req.query;

  const notificacoes = await prisma.notificacao.findMany({
    where: {
      boleto: { empresaId: req.empresa.empresaId },
      ...(boletoId ? { boletoId: String(boletoId) } : {}),
      ...(status ? { status: String(status) as any } : {}),
    },
    include: {
      boleto: { select: { id: true, descricao: true, valor: true, dataVencimento: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 50,
  });

  res.json(notificacoes);
}

export async function reenviar(req: Request, res: Response) {
  const notificacao = await prisma.notificacao.findFirst({
    where: {
      id: req.params.id,
      boleto: { empresaId: req.empresa.empresaId },
    },
  });

  if (!notificacao) {
    res.status(404).json({ error: "Notificação não encontrada" });
    return;
  }
  if (notificacao.status === "ENVIADO") {
    res.status(409).json({ error: "Notificação já foi enviada com sucesso" });
    return;
  }

  const config = await prisma.configuracaoWpp.findUnique({
    where: { empresaId: req.empresa.empresaId },
  });
  if (!config?.ativo) {
    res.status(400).json({ error: "Integração WhatsApp não configurada" });
    return;
  }

  try {
    await enviarNotificacao(config, notificacao.telefone, notificacao.mensagem);
    const atualizada = await prisma.notificacao.update({
      where: { id: notificacao.id },
      data: { status: "ENVIADO", enviadoEm: new Date(), erro: null, tentativas: { increment: 1 } },
    });
    res.json(atualizada);
  } catch (err: any) {
    await prisma.notificacao.update({
      where: { id: notificacao.id },
      data: { status: "FALHOU", erro: err.message, tentativas: { increment: 1 } },
    });
    res.status(502).json({ error: "Falha ao enviar WhatsApp", detalhe: err.message });
  }
}
