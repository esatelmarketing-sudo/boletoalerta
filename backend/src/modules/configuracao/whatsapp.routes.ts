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

    // Cria a instância se não existir
    await axios.post(
      `${config.evolutionApiUrl}/instance/create`,
      { instanceName: config.instanceName, qrcode: true },
      { headers: { apikey: config.evolutionApiKey } }
    ).catch(() => null); // ignora se já existir

    // Busca o QR code
    const { data } = await axios.get(
      `${config.evolutionApiUrl}/instance/connect/${config.instanceName}`,
      { headers: { apikey: config.evolutionApiKey } }
    );

    res.json(data);
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
