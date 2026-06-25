import { StatusBoleto, StatusNotificacao, TipoBoleto } from "../../types";

const statusColors: Record<StatusBoleto, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  PAGO: "bg-green-100 text-green-800",
  VENCIDO: "bg-red-100 text-red-800",
  CANCELADO: "bg-gray-100 text-gray-600",
};

const statusLabels: Record<StatusBoleto, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

const tipoColors: Record<TipoBoleto, string> = {
  PAGAR: "bg-red-50 text-red-700",
  RECEBER: "bg-blue-50 text-blue-700",
};

const notifColors: Record<StatusNotificacao, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  ENVIADO: "bg-green-100 text-green-800",
  FALHOU: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: StatusBoleto }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

export function TipoBadge({ tipo }: { tipo: TipoBoleto }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tipoColors[tipo]}`}>
      {tipo === "PAGAR" ? "A Pagar" : "A Receber"}
    </span>
  );
}

export function NotifStatusBadge({ status }: { status: StatusNotificacao }) {
  const labels = { PENDENTE: "Pendente", ENVIADO: "Enviado", FALHOU: "Falhou" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${notifColors[status]}`}>
      {labels[status]}
    </span>
  );
}
