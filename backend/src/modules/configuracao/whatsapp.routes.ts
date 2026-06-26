import { Router } from "express";
import axios from "axios";
import { prisma } from "../../lib/prisma";

const router = Router();
const TIMEOUT = 15_000;

async function getConfig(empresaId: string) {
  const config = await prisma.configuracaoWpp.findUnique({ where: { empresaId } });
  if (!config) throw new Error("Configuração WhatsApp não encontrada");
  return config;
}

function evoClient(apiKey: string) {
  return axios.create({ headers: { apikey: apiKey }, timeout: TIMEOUT });
}

// Testa conectividade com a Evolution API
router.get("/ping", async (req, res) => {
  try {
    const config = await getConfig(req.empresa.empresaId);
    const { data } = await evoClient(config.evolutionApiKey).get(config.evolutionApiUrl);
    res.json({ ok: true, data });
  } catch (err: any) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

// Cria instância e retorna QR code
router.post("/conectar", async (req, res) => {
  try {
    const config = await getConfig(req.empresa.empresaId);
    const client = evoClient(config.evolutionApiKey);
    const base = config.evolutionApiUrl;

    // Remove instância antiga se existir
    await client.delete(`${base}/instance/delete/${config.instanceName}`).catch(() => null);

    // Cria instância nova com QR code
    const { data } = await client.post(`${base}/instance/create`, {
      instanceName: config.instanceName,
      qrcode: true,
    });

    const base64 = data?.qrcode?.base64 ?? data?.base64 ?? null;
    res.json({ base64 });
  } catch (err: any) {
    console.error("[whatsapp] conectar error:", err.message);
    res.status(502).json({ error: err.message });
  }
});

// Verifica status da conexão
router.get("/status", async (req, res) => {
  try {
    const config = await getConfig(req.empresa.empresaId);
    const { data } = await evoClient(config.evolutionApiKey).get(
      `${config.evolutionApiUrl}/instance/connectionState/${config.instanceName}`
    );
    res.json(data);
  } catch {
    res.json({ instance: { state: "close" } });
  }
});

// Desconecta
router.delete("/desconectar", async (req, res) => {
  try {
    const config = await getConfig(req.empresa.empresaId);
    await evoClient(config.evolutionApiKey).delete(
      `${config.evolutionApiUrl}/instance/logout/${config.instanceName}`
    );
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
