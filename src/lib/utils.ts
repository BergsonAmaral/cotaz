export function formatBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function mesAnoAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function labelMesAno(mesAno: string): string {
  const [ano, mes] = mesAno.split("-");
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${meses[parseInt(mes) - 1]} ${ano}`;
}

export function proximoMes(mesAno: string): string {
  const [ano, mes] = mesAno.split("-").map(Number);
  const d = new Date(ano, mes, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function mesAnterior(mesAno: string): string {
  const [ano, mes] = mesAno.split("-").map(Number);
  const d = new Date(ano, mes - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function primeiroDia(mesAno: string): string {
  return `${mesAno}-01`;
}

export function ultimoDia(mesAno: string): string {
  const [ano, mes] = mesAno.split("-").map(Number);
  const d = new Date(ano, mes, 0);
  return `${mesAno}-${String(d.getDate()).padStart(2, "0")}`;
}

export function diasParaVencer(diaVencimento: number): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diaHoje = hoje.getDate();
  const vencimento = diaVencimento >= diaHoje
    ? new Date(hoje.getFullYear(), hoje.getMonth(), diaVencimento)
    : new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVencimento);
  return Math.round((vencimento.getTime() - hoje.getTime()) / 86400000);
}

export function statusConta(diaVencimento: number, pago: boolean): "paga" | "vencida" | "avencer" | "pendente" {
  if (pago) return "paga";
  const dias = diasParaVencer(diaVencimento);
  if (dias < 0) return "vencida";
  if (dias <= 7) return "avencer";
  return "pendente";
}

export const CATEGORIAS_ENTRADA = [
  "Venda de produto",
  "Prestação de serviço",
  "Delivery",
  "Investimento / Aporte",
  "Outras receitas",
];

export const CATEGORIAS_SAIDA = [
  "Aluguel",
  "Salários / Funcionários",
  "Energia elétrica",
  "Água / Saneamento",
  "Internet / Telefone",
  "Fornecedor / Insumos",
  "Marketing / Publicidade",
  "Transporte / Frete",
  "Manutenção",
  "Impostos / Taxas",
  "Embalagens",
  "Outras despesas",
];

export const CATEGORIAS_CONTA_FIXA = [
  "Aluguel",
  "Funcionário",
  "Energia elétrica",
  "Água",
  "Internet / Telefone",
  "Sistema / Assinatura",
  "Financiamento",
  "Imposto",
  "Outro",
];
