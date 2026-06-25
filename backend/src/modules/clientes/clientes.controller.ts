import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ClienteInput, ClienteUpdateInput } from "./clientes.schema";

export async function listar(req: Request, res: Response) {
  const { search } = req.query;

  const clientes = await prisma.cliente.findMany({
    where: {
      empresaId: req.empresa.empresaId,
      ativo: true,
      ...(search
        ? {
            OR: [
              { nome: { contains: String(search) } },
              { cpfCnpj: { contains: String(search) } },
              { email: { contains: String(search) } },
            ],
          }
        : {}),
    },
    orderBy: { nome: "asc" },
  });

  res.json(clientes);
}

export async function buscarPorId(req: Request, res: Response) {
  const cliente = await prisma.cliente.findFirst({
    where: { id: req.params.id, empresaId: req.empresa.empresaId },
    include: {
      boletos: {
        orderBy: { dataVencimento: "desc" },
        take: 10,
      },
    },
  });

  if (!cliente) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }
  res.json(cliente);
}

export async function criar(req: Request, res: Response) {
  const data = req.body as ClienteInput;
  const cliente = await prisma.cliente.create({
    data: { ...data, empresaId: req.empresa.empresaId },
  });
  res.status(201).json(cliente);
}

export async function atualizar(req: Request, res: Response) {
  const data = req.body as ClienteUpdateInput;

  const existe = await prisma.cliente.findFirst({
    where: { id: req.params.id, empresaId: req.empresa.empresaId },
  });
  if (!existe) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  const cliente = await prisma.cliente.update({
    where: { id: req.params.id },
    data,
  });
  res.json(cliente);
}

export async function remover(req: Request, res: Response) {
  const existe = await prisma.cliente.findFirst({
    where: { id: req.params.id, empresaId: req.empresa.empresaId },
  });
  if (!existe) {
    res.status(404).json({ error: "Cliente não encontrado" });
    return;
  }

  await prisma.cliente.update({
    where: { id: req.params.id },
    data: { ativo: false },
  });
  res.status(204).send();
}
