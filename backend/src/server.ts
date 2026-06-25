import "dotenv/config";
import app from "./app";
import { iniciarJobNotificacoes } from "./jobs/notificacoes.job";

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`[server] Rodando na porta ${PORT}`);
  iniciarJobNotificacoes();
});
