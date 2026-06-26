import express from "express";
import cors from "cors";
import { authMiddleware } from "./middlewares/auth";
import authRoutes from "./modules/auth/auth.routes";
import boletosRoutes from "./modules/boletos/boletos.routes";
import clientesRoutes from "./modules/clientes/clientes.routes";
import configuracaoRoutes from "./modules/configuracao/configuracao.routes";
import whatsappRoutes from "./modules/configuracao/whatsapp.routes";
import notificacoesRoutes from "./modules/notificacoes/notificacoes.routes";

const app = express();

app.use(cors());
app.use(express.json());

// Rotas públicas
app.use("/auth", authRoutes);

// Rotas protegidas por JWT
app.use("/boletos", authMiddleware, boletosRoutes);
app.use("/clientes", authMiddleware, clientesRoutes);
app.use("/configuracao", authMiddleware, configuracaoRoutes);
app.use("/whatsapp", authMiddleware, whatsappRoutes);
app.use("/notificacoes", authMiddleware, notificacoesRoutes);

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Erro global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

export default app;
