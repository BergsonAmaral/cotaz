export type Empresa = {
  id: string;
  nome: string;
  telefone?: string;
  created_at: string;
};

export type TipoTransacao = "entrada" | "saida";

export type Transacao = {
  id: string;
  empresa_id: string;
  tipo: TipoTransacao;
  valor: number;
  categoria: string;
  descricao?: string;
  data: string;
  created_at: string;
};

export type ContaFixa = {
  id: string;
  empresa_id: string;
  nome: string;
  valor: number;
  dia_vencimento: number;
  categoria: string;
  ativa: boolean;
  created_at: string;
};

export type PagamentoConta = {
  id: string;
  conta_fixa_id: string;
  empresa_id: string;
  mes_ano: string;
  pago: boolean;
  data_pagamento?: string;
  created_at: string;
};

export type ContaFixaComStatus = ContaFixa & {
  pagamento?: PagamentoConta;
};

export type ContaPagar = {
  id: string;
  empresa_id: string;
  descricao: string;
  fornecedor?: string;
  valor: number;
  data_vencimento: string;
  categoria: string;
  pago: boolean;
  data_pagamento?: string;
  lancou_caixa: boolean;
  created_at: string;
};
