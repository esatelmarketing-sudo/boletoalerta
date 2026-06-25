import { useQueries } from "@tanstack/react-query";
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Boleto, PaginatedResponse } from "../types";
import { StatusBadge, TipoBadge } from "../components/ui/Badge";
import { useAuth } from "../contexts/AuthContext";

function fmt(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

function somaValores(boletos: Boleto[]) {
  return boletos.reduce((acc, b) => acc + Number(b.valor), 0);
}

function isVencendoEm5Dias(b: Boleto) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(b.dataVencimento);
  venc.setHours(0, 0, 0, 0);
  const diff = Math.round((venc.getTime() - hoje.getTime()) / 86400000);
  return diff >= 0 && diff <= 5;
}

export default function Dashboard() {
  const { empresa } = useAuth();

  const results = useQueries({
    queries: [
      {
        queryKey: ["boletos", "pagar", "pendente"],
        queryFn: () => api.get<PaginatedResponse<Boleto>>("/boletos?tipo=PAGAR&status=PENDENTE&limit=100").then(r => r.data),
      },
      {
        queryKey: ["boletos", "receber", "pendente"],
        queryFn: () => api.get<PaginatedResponse<Boleto>>("/boletos?tipo=RECEBER&status=PENDENTE&limit=100").then(r => r.data),
      },
      {
        queryKey: ["boletos", "recentes"],
        queryFn: () => api.get<PaginatedResponse<Boleto>>("/boletos?limit=8").then(r => r.data),
      },
    ],
  });

  const pagar = results[0].data?.data ?? [];
  const receber = results[1].data?.data ?? [];
  const recentes = results[2].data?.data ?? [];

  const vencendoBrevePagar = pagar.filter(isVencendoEm5Dias).length;
  const vencendoBreveReceber = receber.filter(isVencendoEm5Dias).length;

  const cards = [
    {
      label: "Total a Pagar",
      value: fmt(somaValores(pagar)),
      sub: `${pagar.length} boleto(s) pendente(s)`,
      icon: TrendingDown,
      color: "text-red-600 bg-red-50",
    },
    {
      label: "Total a Receber",
      value: fmt(somaValores(receber)),
      sub: `${receber.length} boleto(s) pendente(s)`,
      icon: TrendingUp,
      color: "text-green-600 bg-green-50",
    },
    {
      label: "Vencendo em 5 dias (Pagar)",
      value: vencendoBrevePagar.toString(),
      sub: "alertas serão disparados",
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Vencendo em 5 dias (Receber)",
      value: vencendoBreveReceber.toString(),
      sub: "clientes serão notificados",
      icon: CheckCircle,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Olá, {empresa?.nome} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Resumo financeiro do dia</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 leading-tight">{c.label}</p>
              <div className={`p-1.5 rounded-lg ${c.color}`}>
                <c.icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Boletos recentes</h2>
          <Link to="/boletos" className="text-xs text-blue-600 hover:underline">Ver todos</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentes.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">Nenhum boleto cadastrado ainda.</p>
          )}
          {recentes.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-6 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <TipoBadge tipo={b.tipo} />
                <span className="text-sm text-gray-700 truncate">{b.descricao ?? "Sem descrição"}</span>
                {b.cliente && (
                  <span className="text-xs text-gray-400 hidden xl:block">• {b.cliente.nome}</span>
                )}
              </div>
              <div className="flex items-center gap-4 shrink-0 ml-4">
                <span className="text-sm font-semibold text-gray-900">{fmt(b.valor)}</span>
                <span className="text-xs text-gray-400">{fmtDate(b.dataVencimento)}</span>
                <StatusBadge status={b.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
