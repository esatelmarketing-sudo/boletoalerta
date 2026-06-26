import { useEffect, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, CheckCircle, Loader2, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { ConfiguracaoWpp } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const schema = z.object({
  evolutionApiUrl: z.string().url("URL inválida"),
  evolutionApiKey: z.string().min(1, "Informe a API key"),
  instanceName: z.string().min(1, "Informe o nome da instância"),
  telefoneFinanceiro: z.string().min(10, "Informe com DDI+DDD (ex: 5511999999999)"),
  ativo: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

type StatusWpp = "desconectado" | "conectando" | "conectado";

export default function Configuracao() {
  const qc = useQueryClient();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [statusWpp, setStatusWpp] = useState<StatusWpp>("desconectado");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: config, isLoading } = useQuery({
    queryKey: ["configuracao"],
    queryFn: () => api.get<ConfiguracaoWpp | null>("/configuracao").then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (config) {
      reset({
        evolutionApiUrl: config.evolutionApiUrl,
        evolutionApiKey: "",
        instanceName: config.instanceName,
        telefoneFinanceiro: config.telefoneFinanceiro,
        ativo: config.ativo,
      });
    }
  }, [config, reset]);

  // Verifica status ao carregar
  useEffect(() => {
    if (config?.ativo) verificarStatus();
    return () => pararPolling();
  }, [config]);

  async function verificarStatus() {
    try {
      const { data } = await api.get("/whatsapp/status");
      const state = data?.instance?.state ?? data?.state ?? "";
      if (state === "open") {
        setStatusWpp("conectado");
        pararPolling();
      } else {
        setStatusWpp("desconectado");
      }
    } catch {
      setStatusWpp("desconectado");
    }
  }

  function iniciarPolling() {
    pararPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await api.get("/whatsapp/status");
        const state = data?.instance?.state ?? data?.state ?? "";
        if (state === "open") {
          setStatusWpp("conectado");
          setQrCode(null);
          pararPolling();
          toast.success("WhatsApp conectado!");
        }
      } catch {}
    }, 4000);
  }

  function pararPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  async function conectar() {
    setStatusWpp("conectando");
    setQrCode(null);
    try {
      const { data } = await api.post("/whatsapp/conectar");
      const qr = data?.base64 ?? null;
      if (qr) {
        setQrCode(qr);
        iniciarPolling();
      } else {
        toast.error("QR code não retornado. Verifique a configuração.");
        setStatusWpp("desconectado");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Erro ao conectar");
      setStatusWpp("desconectado");
    }
  }

  async function desconectar() {
    try {
      await api.delete("/whatsapp/desconectar");
      setStatusWpp("desconectado");
      setQrCode(null);
      pararPolling();
      toast.success("WhatsApp desconectado");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? "Erro ao desconectar");
    }
  }

  const salvar = useMutation({
    mutationFn: (d: FormData) => api.post("/configuracao", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["configuracao"] });
      toast.success("Configuração salva!");
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Erro ao salvar"),
  });

  if (isLoading) return <div className="p-8 text-gray-400">Carregando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
          <MessageCircle size={18} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração WhatsApp</h1>
          <p className="text-sm text-gray-500">Integração via Evolution API</p>
        </div>
      </div>

      {/* Status e QR Code */}
      {config && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {statusWpp === "conectado" && <CheckCircle size={16} className="text-green-500" />}
              {statusWpp === "conectando" && <Loader2 size={16} className="text-blue-500 animate-spin" />}
              {statusWpp === "desconectado" && <WifiOff size={16} className="text-gray-400" />}
              <span className="text-sm font-medium text-gray-700">
                {statusWpp === "conectado" && "WhatsApp conectado"}
                {statusWpp === "conectando" && "Aguardando leitura do QR code..."}
                {statusWpp === "desconectado" && "WhatsApp desconectado"}
              </span>
            </div>
            <div className="flex gap-2">
              {statusWpp !== "conectado" && (
                <Button size="sm" onClick={conectar} loading={statusWpp === "conectando"}>
                  Conectar WhatsApp
                </Button>
              )}
              {statusWpp === "conectado" && (
                <Button size="sm" variant="danger" onClick={desconectar}>
                  Desconectar
                </Button>
              )}
            </div>
          </div>

          {qrCode && (
            <div className="flex flex-col items-center gap-3 py-4">
              <p className="text-sm text-gray-500 text-center">
                Abra o WhatsApp no celular → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>
              </p>
              <img
                src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                alt="QR Code WhatsApp"
                className="w-56 h-56 border border-gray-200 rounded-xl"
              />
              <p className="text-xs text-gray-400">O QR code expira em 60 segundos</p>
            </div>
          )}
        </div>
      )}

      {/* Formulário */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados da Evolution API</h2>
        <form onSubmit={handleSubmit(d => salvar.mutate(d))} className="space-y-5">
          <Input
            label="URL da Evolution API"
            placeholder="http://209.50.254.198:8080"
            required
            error={errors.evolutionApiUrl?.message}
            {...register("evolutionApiUrl")}
          />
          <Input
            label="API Key"
            type="password"
            placeholder={config ? "••••••••••• (deixe em branco para manter)" : "Sua API key"}
            required={!config}
            error={errors.evolutionApiKey?.message}
            {...register("evolutionApiKey")}
          />
          <Input
            label="Nome da instância"
            placeholder="boletoalerta"
            required
            error={errors.instanceName?.message}
            {...register("instanceName")}
          />
          <div>
            <Input
              label="Número financeiro (boletos a PAGAR)"
              placeholder="5511999999999"
              required
              error={errors.telefoneFinanceiro?.message}
              {...register("telefoneFinanceiro")}
            />
            <p className="text-xs text-gray-400 mt-1">DDI+DDD+número, sem espaços ou traços.</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="ativo" {...register("ativo")} className="rounded border-gray-300 text-blue-600" />
            <label htmlFor="ativo" className="text-sm text-gray-700">Ativar disparo de notificações</label>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={isSubmitting || salvar.isPending}>
              Salvar configuração
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-1">Como funciona o disparo</p>
        <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
          <li>Todo dia às 08:00 (Brasília) o sistema verifica boletos vencendo em 5 dias</li>
          <li>Boletos <strong>a pagar</strong> → mensagem para o número financeiro acima</li>
          <li>Boletos <strong>a receber</strong> → mensagem para o WhatsApp do cliente</li>
        </ul>
      </div>
    </div>
  );
}
