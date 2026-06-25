import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, CheckCircle, XCircle, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { Boleto, Cliente, PaginatedResponse, StatusBoleto, TipoBoleto } from "../types";
import { StatusBadge, TipoBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

const schema = z.object({
  tipo: z.enum(["PAGAR", "RECEBER"]),
  clienteId: z.string().optional(),
  descricao: z.string().optional(),
  valor: z.coerce.number().positive("Valor inválido"),
  dataVencimento: z.string().min(1, "Informe a data"),
  linhaDigitavel: z.string().optional(),
  nossoNumero: z.string().optional(),
  observacoes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function fmt(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
}
function toInputDate(iso: string) {
  return iso.split("T")[0];
}

export default function Boletos() {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<TipoBoleto | "">("");
  const [status, setStatus] = useState<StatusBoleto | "">("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<{ open: boolean; boleto?: Boleto; view?: boolean }>({ open: false });

  const params = new URLSearchParams({ page: String(page), limit: "15" });
  if (tipo) params.set("tipo", tipo);
  if (status) params.set("status", status);

  const { data, isLoading } = useQuery({
    queryKey: ["boletos", tipo, status, page],
    queryFn: () => api.get<PaginatedResponse<Boleto>>(`/boletos?${params}`).then(r => r.data),
  });

  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: () => api.get<Cliente[]>("/clientes").then(r => r.data),
  });

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo: "RECEBER" },
  });

  const tipoWatch = watch("tipo");

  function openCreate() {
    reset({ tipo: "RECEBER" });
    setModal({ open: true });
  }
  function openEdit(b: Boleto) {
    reset({
      tipo: b.tipo,
      clienteId: b.clienteId ?? "",
      descricao: b.descricao ?? "",
      valor: Number(b.valor),
      dataVencimento: toInputDate(b.dataVencimento),
      linhaDigitavel: b.linhaDigitavel ?? "",
      nossoNumero: b.nossoNumero ?? "",
      observacoes: b.observacoes ?? "",
    });
    setModal({ open: true, boleto: b });
  }
  function openView(b: Boleto) {
    setModal({ open: true, boleto: b, view: true });
  }

  const salvar = useMutation({
    mutationFn: (d: FormData) =>
      modal.boleto
        ? api.put(`/boletos/${modal.boleto.id}`, d)
        : api.post("/boletos", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boletos"] });
      setModal({ open: false });
      toast.success(modal.boleto ? "Boleto atualizado!" : "Boleto criado!");
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Erro ao salvar"),
  });

  const marcarPago = useMutation({
    mutationFn: (id: string) => api.patch(`/boletos/${id}/pagar`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["boletos"] }); toast.success("Marcado como pago!"); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Erro"),
  });

  const cancelar = useMutation({
    mutationFn: (id: string) => api.patch(`/boletos/${id}/cancelar`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["boletos"] }); toast.success("Boleto cancelado"); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Erro"),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boletos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie boletos a pagar e a receber</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} /> Novo boleto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <select
          value={tipo}
          onChange={e => { setTipo(e.target.value as any); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos os tipos</option>
          <option value="PAGAR">A Pagar</option>
          <option value="RECEBER">A Receber</option>
        </select>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value as any); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
          <option value="VENCIDO">Vencido</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Cliente</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Vencimento</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Carregando...</td></tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Nenhum boleto encontrado.</td></tr>
            )}
            {data?.data.map(b => (
              <tr key={b.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3.5"><TipoBadge tipo={b.tipo} /></td>
                <td className="px-5 py-3.5 text-gray-700">{b.descricao ?? <span className="text-gray-400">—</span>}</td>
                <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{b.cliente?.nome ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{fmt(b.valor)}</td>
                <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{fmtDate(b.dataVencimento)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openView(b)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Ver detalhes"><Eye size={15} /></button>
                    {b.status === "PENDENTE" && (
                      <>
                        <button onClick={() => openEdit(b)} className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md">Editar</button>
                        <button onClick={() => { if (confirm("Marcar como pago?")) marcarPago.mutate(b.id); }} className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Marcar pago"><CheckCircle size={15} /></button>
                        <button onClick={() => { if (confirm("Cancelar boleto?")) cancelar.mutate(b.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Cancelar"><XCircle size={15} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">{data.total} boleto(s) no total</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-sm text-gray-600 self-center">{page}/{data.pages}</span>
              <Button variant="secondary" size="sm" disabled={page === data.pages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      <Modal
        open={modal.open && !modal.view}
        onClose={() => setModal({ open: false })}
        title={modal.boleto ? "Editar boleto" : "Novo boleto"}
        size="lg"
      >
        <form onSubmit={handleSubmit(d => salvar.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" required error={errors.tipo?.message} {...register("tipo")}>
              <option value="RECEBER">A Receber</option>
              <option value="PAGAR">A Pagar</option>
            </Select>
            {tipoWatch === "RECEBER" && (
              <Select label="Cliente" required error={errors.clienteId?.message} {...register("clienteId")}>
                <option value="">Selecione...</option>
                {clientes?.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            )}
          </div>
          <Input label="Descrição" placeholder="Ex: Aluguel julho/2025" {...register("descricao")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor (R$)" type="number" step="0.01" min="0.01" required error={errors.valor?.message} {...register("valor")} />
            <Input label="Vencimento" type="date" required error={errors.dataVencimento?.message} {...register("dataVencimento")} />
          </div>
          <Input label="Linha digitável" placeholder="000..." {...register("linhaDigitavel")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nosso número" {...register("nossoNumero")} />
            <Input label="Número do documento" {...register("nossoNumero")} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Observações</label>
            <textarea rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" {...register("observacoes")} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting || salvar.isPending}>
              {modal.boleto ? "Salvar alterações" : "Criar boleto"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal visualizar */}
      {modal.boleto && (
        <Modal open={!!modal.view} onClose={() => setModal({ open: false })} title="Detalhes do boleto">
          <div className="space-y-3 text-sm">
            {(
              [
                ["Tipo", <TipoBadge tipo={modal.boleto.tipo} />],
                ["Status", <StatusBadge status={modal.boleto.status} />],
                ["Descrição", modal.boleto.descricao ?? "—"],
                ["Valor", fmt(modal.boleto.valor)],
                ["Vencimento", fmtDate(modal.boleto.dataVencimento)],
                modal.boleto.dataPagamento ? ["Pago em", fmtDate(modal.boleto.dataPagamento)] : null,
                ["Cliente", modal.boleto.cliente?.nome ?? "—"],
                ["Linha digitável", modal.boleto.linhaDigitavel ?? "—"],
                ["Observações", modal.boleto.observacoes ?? "—"],
              ] as Array<[string, React.ReactNode] | null>
            ).filter((x): x is [string, React.ReactNode] => x !== null).map(([label, value]) => (
              <div key={String(label)} className="flex gap-2">
                <span className="w-32 shrink-0 text-gray-500">{label}</span>
                <span className="text-gray-900 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
