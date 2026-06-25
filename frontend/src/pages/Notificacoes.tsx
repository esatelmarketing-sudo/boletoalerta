import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { Notificacao, StatusNotificacao } from "../types";
import { NotifStatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

const tipoLabels: Record<string, string> = {
  LEMBRETE_5_DIAS: "5 dias antes",
  LEMBRETE_1_DIA: "1 dia antes",
  VENCIMENTO_HOJE: "Vencimento hoje",
  ATRASO: "Atraso",
};

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function fmt(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Notificacoes() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusNotificacao | "">("");

  const params = new URLSearchParams();
  if (status) params.set("status", status);

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ["notificacoes", status],
    queryFn: () => api.get<Notificacao[]>(`/notificacoes?${params}`).then(r => r.data),
  });

  const reenviar = useMutation({
    mutationFn: (id: string) => api.post(`/notificacoes/${id}/reenviar`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notificacoes"] }); toast.success("Notificação reenviada!"); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Erro ao reenviar"),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
          <p className="text-sm text-gray-500 mt-0.5">Histórico de mensagens WhatsApp disparadas</p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["notificacoes"] })}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="mb-5">
        <select
          value={status}
          onChange={e => setStatus(e.target.value as any)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="ENVIADO">Enviado</option>
          <option value="FALHOU">Falhou</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Boleto</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Enviado em</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Tentativas</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <tr><td colSpan={7} className="text-center py-10 text-gray-400">Carregando...</td></tr>}
            {!isLoading && notificacoes.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Nenhuma notificação encontrada.</td></tr>
            )}
            {notificacoes.map(n => (
              <tr key={n.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3.5">
                  <div>
                    <p className="text-gray-700 font-medium truncate max-w-[200px]">
                      {n.boleto?.descricao ?? "Sem descrição"}
                    </p>
                    {n.boleto && (
                      <p className="text-xs text-gray-400">{fmt(n.boleto.valor)}</p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{tipoLabels[n.tipo] ?? n.tipo}</td>
                <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">{n.telefone}</td>
                <td className="px-5 py-3.5"><NotifStatusBadge status={n.status} /></td>
                <td className="px-5 py-3.5 text-gray-500 text-xs hidden lg:table-cell">{fmtDate(n.enviadoEm)}</td>
                <td className="px-5 py-3.5 text-gray-500 text-center hidden xl:table-cell">{n.tentativas}</td>
                <td className="px-5 py-3.5">
                  {n.status === "FALHOU" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={reenviar.isPending}
                      onClick={() => reenviar.mutate(n.id)}
                    >
                      Reenviar
                    </Button>
                  )}
                  {n.status === "FALHOU" && n.erro && (
                    <p className="text-xs text-red-500 mt-1 max-w-[160px] truncate" title={n.erro}>{n.erro}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
