import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageCircle, CheckCircle } from "lucide-react";
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

export default function Configuracao() {
  const qc = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ["configuracao"],
    queryFn: () => api.get<ConfiguracaoWpp | null>("/configuracao").then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
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
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
          <MessageCircle size={18} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração WhatsApp</h1>
          <p className="text-sm text-gray-500">Integração via Evolution API</p>
        </div>
      </div>

      {config?.ativo && (
        <div className="flex items-center gap-2 mt-4 mb-6 px-4 py-3 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <span className="text-sm text-green-700">Integração ativa — instância <strong>{config.instanceName}</strong></span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <form onSubmit={handleSubmit(d => salvar.mutate(d))} className="space-y-5">
          <Input
            label="URL da Evolution API"
            placeholder="https://api.suaevolution.com"
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
            placeholder="minha-empresa"
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
            <p className="text-xs text-gray-400 mt-1">
              Todos os lembretes de boletos a pagar serão enviados para este número. Formato: DDI+DDD+número.
            </p>
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
          <li>Todo dia às 08:00 (horário de Brasília) o sistema verifica boletos vencendo em 5 dias</li>
          <li>Boletos <strong>a pagar</strong> → mensagem enviada para o número financeiro acima</li>
          <li>Boletos <strong>a receber</strong> → mensagem enviada para o WhatsApp do cliente</li>
          <li>Cada boleto recebe no máximo 1 lembrete de 5 dias (sem duplicatas)</li>
        </ul>
      </div>
    </div>
  );
}
