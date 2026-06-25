import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";
import { RegisterInput, LoginInput } from "./auth.schema";

export async function register(req: Request, res: Response) {
  const { nome, email, senha, cnpj } = req.body as RegisterInput;

  const existe = await prisma.empresa.findUnique({ where: { email } });
  if (existe) {
    res.status(409).json({ error: "E-mail já cadastrado" });
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 12);
  const empresa = await prisma.empresa.create({
    data: { nome, email, senhaHash, cnpj },
    select: { id: true, nome: true, email: true, plano: true, criadoEm: true },
  });

  const token = gerarToken(empresa.id, empresa.email);
  res.status(201).json({ empresa, token });
}

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body as LoginInput;

  const empresa = await prisma.empresa.findUnique({ where: { email } });
  if (!empresa || !empresa.ativo) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const senhaOk = await bcrypt.compare(senha, empresa.senhaHash);
  if (!senhaOk) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const token = gerarToken(empresa.id, empresa.email);
  res.json({
    empresa: { id: empresa.id, nome: empresa.nome, email: empresa.email, plano: empresa.plano },
    token,
  });
}

export async function me(req: Request, res: Response) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: req.empresa.empresaId },
    select: { id: true, nome: true, email: true, cnpj: true, plano: true, criadoEm: true },
  });
  res.json(empresa);
}

function gerarToken(empresaId: string, email: string) {
  return jwt.sign({ empresaId, email }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);
}
