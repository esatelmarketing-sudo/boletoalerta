import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../lib/api";
import { Cliente } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";

const schema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  cpfCnpj: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().min(10, "Informe com DDD (ex: 5511999999999)"),
});
type FormData = z.infer<typeof schema>;

export default function Clientes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; cliente?: Cliente }>({ open: false });

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes", search],
    queryFn: () => api.get<Cliente[]>(`/clientes${search ? `?search=${search}` : ""}`).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function openCreate() { reset({ nome: "", cpfCnpj: "", email: "", telefone: "" }); setModal({ open: true }); }
  function openEdit(c: Cliente) {
    reset({ nome: c.nome, cpfCnpj: c.cpfCnpj ?? "", email: c.email ?? "", telefone: c.telefone });
    setModal({ open: true, cliente: c });
  }

  const salvar = useMutation({
    mutationFn: (d: FormData) =>
      modal.cliente ? api.put(`/clientes/${modal.cliente.id}`, d) : api.post("/clientes", d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setModal({ open: false });
      toast.success(modal.cliente ? "Cliente atualizado!" : "Cliente criado!");
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Erro ao salvar"),
  });

  const remover = useMutation({
    mutationFn: (id: string) => api.delete(`/clientes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clientes"] }); toast.success("Cliente removido"); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? "Erro"),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Cadastre os destinatários dos boletos a receber</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Novo cliente</Button>
      </div>

      <div className="mb-5">
        <input
          type="search"
          placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">CPF/CNPJ</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">E-mail</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">WhatsApp</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <tr><td colSpan={5} className="text-center py-10 text-gray-400">Carregando...</td></tr>}
            {!isLoading && clientes.length === 0 && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Nenhum cliente cadastrado.</td></tr>
            )}
            {clientes.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-5 py-3.5 font-medium text-gray-900">{c.nome}</td>
                <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{c.cpfCnpj ?? "—"}</td>
                <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{c.email ?? "—"}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.telefone}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Pencil size={14} /></button>
                    <button onClick={() => { if (confirm(`Remover ${c.nome}?`)) remover.mutate(c.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.cliente ? "Editar cliente" : "Novo cliente"}>
        <form onSubmit={handleSubmit(d => salvar.mutate(d))} className="space-y-4">
          <Input label="Nome" required placeholder="João Silva" error={errors.nome?.message} {...register("nome")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CPF / CNPJ" placeholder="000.000.000-00" {...register("cpfCnpj")} />
            <Input label="E-mail" type="email" placeholder="joao@email.com" error={errors.email?.message} {...register("email")} />
          </div>
          <Input label="WhatsApp (com DDI)" required placeholder="5511999999999" error={errors.telefone?.message} {...register("telefone")} />
          <p className="text-xs text-gray-400">Formato: DDI + DDD + número. Ex: 5511999999999</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting || salvar.isPending}>
              {modal.cliente ? "Salvar" : "Criar cliente"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
