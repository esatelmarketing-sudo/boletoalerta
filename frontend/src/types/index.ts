export type Plano = "FREE" | "BASICO" | "PRO";
export type TipoBoleto = "PAGAR" | "RECEBER";
export type StatusBoleto = "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
export type TipoNotificacao = "LEMBRETE_5_DIAS" | "LEMBRETE_1_DIA" | "VENCIMENTO_HOJE" | "ATRASO";
export type StatusNotificacao = "PENDENTE" | "ENVIADO" | "FALHOU";

export interface Empresa {
  id: string;
  nome: string;
  email: string;
  cnpj?: string;
  plano: Plano;
  criadoEm: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Boleto {
  id: string;
  tipo: TipoBoleto;
  status: StatusBoleto;
  descricao?: string;
  valor: string;
  dataVencimento: string;
  dataPagamento?: string;
  numeroDocumento?: string;
  linhaDigitavel?: string;
  nossoNumero?: string;
  observacoes?: string;
  clienteId?: string;
  cliente?: Pick<Cliente, "id" | "nome" | "telefone">;
  criadoEm: string;
}

export interface Notificacao {
  id: string;
  boletoId: string;
  tipo: TipoNotificacao;
  status: StatusNotificacao;
  telefone: string;
  mensagem: string;
  tentativas: number;
  enviadoEm?: string;
  erro?: string;
  criadoEm: string;
  boleto?: Pick<Boleto, "id" | "descricao" | "valor" | "dataVencimento">;
}

export interface ConfiguracaoWpp {
  id: string;
  evolutionApiUrl: string;
  instanceName: string;
  telefoneFinanceiro: string;
  ativo: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
