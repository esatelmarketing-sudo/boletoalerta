import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { BoletoInput, BoletoUpdateInput, filtrosSchema } from "./boletos.schema";

export async function listar(req: Request, res: Response) {
  const filtros = filtrosSchema.parse(req.query);
  const { tipo, status, clienteId, vencimentoDe, vencimentoAte, page, limit } = filtros;
  const skip = (page - 1) * limit;

  const where = {
    empresaId: req.empresa.empresaId,
    ...(tipo && { tipo }),
    ...(status && { status }),
    ...(clienteId && { clienteId }),
    ...(vencimentoDe || vencimentoAte
      ? { dataVencimento: { gte: vencimentoDe, lte: vencimentoAte } }
      : {}),
  };

  const [total, boletos] = await Promise.all([
    prisma.boleto.count({ where }),
    prisma.boleto.findMany({
      where,
      include: { cliente: { select: { id: true, nome: true, telefone: true } } },
      orderBy: { dataVencimento: "asc" },
      skip,
      take: limit,
    }),
  ]);

  res.json({ data: boletos, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function buscarPorId(req: Request, res: Response) {
  const boleto = await prisma.boleto.findFirst({
    where: { id: req.params.id, empresaId: req.empresa.empresaId },
    include: {
      cliente: true,
      notificacoes: { orderBy: { criadoEm: "desc" } },
    },
  });

  if (!boleto) {
    res.status(404).json({ error: "Boleto não encontrado" });
    return;
  }
  res.json(boleto);
}

export async function criar(req: Request, res: Response) {
  const data = req.body as BoletoInput;

  const boleto = await prisma.boleto.create({
    data: {
      empresaId: req.empresa.empresaId,
      tipo: data.tipo,
      clienteId: data.clienteId ?? null,
      descricao: data.descricao,
      valor: data.valor,
      dataVencimento: data.dataVencimento,
      numeroDocumento: data.numeroDocumento,
      linhaDigitavel: data.linhaDigitavel,
      nossoNumero: data.nossoNumero,
      observacoes: data.observacoes,
    },
    include: { cliente: { select: { id: true, nome: true } } },
  });

  res.status(201).json(boleto);
}

export async function atualizar(req: Request, res: Response) {
  const data = req.body as BoletoUpdateInput;

  const existe = await prisma.boleto.findFirst({
    where: { id: req.params.id, empresaId: req.empresa.empresaId },
  });
  if (!existe) {
    res.status(404).json({ error: "Boleto não encontrado" });
    return;
  }
  if (existe.status === "PAGO" || existe.status === "CANCELADO") {
    res.status(409).json({ error: "Boleto já encerrado não pode ser editado" });
    return;
  }

  const boleto = await prisma.boleto.update({
    where: { id: req.params.id },
    data: {
      ...data,
      valor: data.valor !== undefined ? data.valor : undefined,
    },
  });
  res.json(boleto);
}

export async function marcarPago(req: Request, res: Response) {
  const existe = await prisma.boleto.findFirst({
    where: { id: req.params.id, empresaId: req.empresa.empresaId },
  });
  if (!existe) {
    res.status(404).json({ error: "Boleto não encontrado" });
    return;
  }
  if (existe.status === "CANCELADO") {
    res.status(409).json({ error: "Boleto cancelado não pode ser pago" });
    return;
  }

  const boleto = await prisma.boleto.update({
    where: { id: req.params.id },
    data: { status: "PAGO", dataPagamento: new Date() },
  });
  res.json(boleto);
}

export async function cancelar(req: Request, res: Response) {
  const existe = await prisma.boleto.findFirst({
    where: { id: req.params.id, empresaId: req.empresa.empresaId },
  });
  if (!existe) {
    res.status(404).json({ error: "Boleto não encontrado" });
    return;
  }
  if (existe.status === "PAGO") {
    res.status(409).json({ error: "Boleto pago não pode ser cancelado" });
    return;
  }

  const boleto = await prisma.boleto.update({
    where: { id: req.params.id },
    data: { status: "CANCELADO" },
  });
  res.json(boleto);
}
