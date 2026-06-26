import { Router } from "express";
import axios from "axios";
import { prisma } from "../../lib/prisma";

const router = Router();

async function getConfig(empresaId: string) {
  const config = await prisma.configuracaoWpp.findUnique({ where: { empresaId } });
  if (!config) throw new Error("Configuração WhatsApp não encontrada");
  return config;
}

// Cria instância e retorna QR code
router.post("/conectar", async (req, res) => {
  try {
    const config = await getConfig(req.empresa.empresaId);

    let base64: string | null = null;

    // Tenta criar a instância — o QR vem na resposta da criação
    try {
      const { data: created } = await axios.post(
        `${config.evolutionApiUrl}/instance/create`,
        { instanceName: config.instanceName, qrcode: true },
        { headers: { apikey: config.evolutionApiKey } }
      );
      base64 = created?.qrcode?.base64 ?? created?.base64 ?? null;
    } catch {
      // Instância já existe — busca QR pelo endpoint connect
      const { data: connected } = await axios.get(
        `${config.evolutionApiUrl}/instance/connect/${config.instanceName}`,
        { headers: { apikey: config.evolutionApiKey } }
      );
      base64 = connected?.qrcode?.base64 ?? connected?.base64 ?? connected?.code ?? null;
    }

    res.json({ base64 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Verifica status da conexão
router.get("/status", async (req, res) => {
  try {
    const config = await getConfig(req.empresa.empresaId);
    const { data } = await axios.get(
      `${config.evolutionApiUrl}/instance/connectionState/${config.instanceName}`,
      { headers: { apikey: config.evolutionApiKey } }
    );
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Desconecta
router.delete("/desconectar", async (req, res) => {
  try {
    const config = await getConfig(req.empresa.empresaId);
    await axios.delete(
      `${config.evolutionApiUrl}/instance/logout/${config.instanceName}`,
      { headers: { apikey: config.evolutionApiKey } }
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
