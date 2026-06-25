import { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { ConfiguracaoInput } from "./configuracao.schema";

export async function buscar(req: Request, res: Response) {
  const config = await prisma.configuracaoWpp.findUnique({
    where: { empresaId: req.empresa.empresaId },
    // nunca expõe a API key na resposta
    select: {
      id: true,
      evolutionApiUrl: true,
      instanceName: true,
      telefoneFinanceiro: true,
      ativo: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });
  res.json(config ?? null);
}

export async function salvar(req: Request, res: Response) {
  const data = req.body as ConfiguracaoInput;

  const config = await prisma.configuracaoWpp.upsert({
    where: { empresaId: req.empresa.empresaId },
    create: { empresaId: req.empresa.empresaId, ...data },
    update: data,
    select: {
      id: true,
      evolutionApiUrl: true,
      instanceName: true,
      telefoneFinanceiro: true,
      ativo: true,
    },
  });
  res.json(config);
}

export async function remover(req: Request, res: Response) {
  await prisma.configuracaoWpp.deleteMany({
    where: { empresaId: req.empresa.empresaId },
  });
  res.status(204).send();
}
