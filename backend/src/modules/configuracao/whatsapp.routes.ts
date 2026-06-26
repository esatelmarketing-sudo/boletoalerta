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

    const name = config.instanceName;

    // Tenta logout e delete para limpar estado anterior
    await client.delete(`${base}/instance/logout/${name}`).catch(() => null);
    await client.delete(`${base}/instance/delete/${name}`).catch(() => null);

    // Tenta criar instância nova
    let data: any;
    try {
      const res2 = await client.post(`${base}/instance/create`, { instanceName: name, qrcode: true });
      data = res2.data;
    } catch (createErr: any) {
      // Instância persistiu — busca QR pelo connect
      if (createErr.response?.status === 400) {
        const res2 = await client.get(`${base}/instance/connect/${name}`);
        data = { qrcode: res2.data };
      } else {
        throw createErr;
      }
    }

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
