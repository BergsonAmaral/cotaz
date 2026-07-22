"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  formatBRL, mesAnoAtual, labelMesAno, statusConta, diasParaVencer, CATEGORIAS_CONTA_FIXA,
} from "@/lib/utils";
import type { ContaFixa, ContaFixaComStatus, PagamentoConta } from "@/types";
import {
  CalendarClock, Plus, CheckCircle2, Circle, Trash2, X, Loader2, AlertTriangle, Clock,
} from "lucide-react";

const STATUS_STYLE = {
  paga:     { label: "Paga",      cls: "bg-emerald-100 text-emerald-700" },
  vencida:  { label: "Vencida",   cls: "bg-red-100 text-red-600" },
  avencer:  { label: "A vencer",  cls: "bg-amber-100 text-amber-700" },
  pendente: { label: "Pendente",  cls: "bg-slate-100 text-slate-500" },
};

export default function ContasFixasPage() {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaFixaComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const mesAno = mesAnoAtual();

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("5");
  const [categoria, setCategoria] = useState("");

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    const [{ data: fixas }, { data: pagamentos }] = await Promise.all([
      supabase.from("caixa_contas_fixas").select("*")
        .eq("empresa_id", user!.id).eq("ativa", true).order("dia_vencimento"),
      supabase.from("caixa_pagamentos").select("*")
        .eq("empresa_id", user!.id).eq("mes_ano", mesAno),
    ]);
    setContas(((fixas ?? []) as ContaFixa[]).map(c => ({
      ...c,
      pagamento: (pagamentos as PagamentoConta[] | null)?.find(p => p.conta_fixa_id === c.id),
    })));
    setLoading(false);
  }

  async function salvar() {
    if (!nome || !valor || !categoria) return;
    const num = parseFloat(valor.replace(",", "."));
    if (isNaN(num) || num <= 0) return;
    setSalvando(true);
    const { error } = await supabase.from("caixa_contas_fixas").insert({
      empresa_id: user!.id,
      nome: nome.trim(),
      valor: num,
      dia_vencimento: parseInt(diaVencimento),
      categoria,
    });
    if (!error) {
      setShowForm(false);
      setNome(""); setValor(""); setDiaVencimento("5"); setCategoria("");
      load();
    }
    setSalvando(false);
  }

  async function togglePagamento(conta: ContaFixaComStatus) {
    const jaPago = conta.pagamento?.pago ?? false;
    if (jaPago) {
      await supabase.from("caixa_pagamentos")
        .update({ pago: false, data_pagamento: null })
        .eq("id", conta.pagamento!.id);
    } else if (conta.pagamento) {
      await supabase.from("caixa_pagamentos")
        .update({ pago: true, data_pagamento: new Date().toISOString().split("T")[0] })
        .eq("id", conta.pagamento.id);
    } else {
      await supabase.from("caixa_pagamentos").insert({
        conta_fixa_id: conta.id,
        empresa_id: user!.id,
        mes_ano: mesAno,
        pago: true,
        data_pagamento: new Date().toISOString().split("T")[0],
      });
    }
    load();
  }

  async function deletar(id: string) {
    if (!confirm("Excluir esta conta fixa? O histórico de pagamentos será apagado.")) return;
    await supabase.from("caixa_contas_fixas").update({ ativa: false }).eq("id", id);
    setContas(prev => prev.filter(c => c.id !== id));
  }

  const pagas = contas.filter(c => c.pagamento?.pago);
  const totalFixas = contas.reduce((s, c) => s + c.valor, 0);
  const totalPagas = pagas.reduce((s, c) => s + c.valor, 0);

  return (
    <div className="mx-auto max-w-xl px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-blue-900" />
          <h1 className="text-xl font-black text-slate-900">Contas Fixas</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-800 transition"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      {/* Mês atual + resumo */}
      <div className="rounded-2xl bg-blue-900 text-white p-4">
        <p className="text-xs font-semibold opacity-70 mb-2">{labelMesAno(mesAno)}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black">{pagas.length} / {contas.length}</p>
            <p className="text-xs opacity-70 mt-0.5">contas pagas</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-black">{formatBRL(totalPagas)}</p>
            <p className="text-xs opacity-70">de {formatBRL(totalFixas)}</p>
          </div>
        </div>
        {contas.length > 0 && (
          <div className="mt-3 w-full h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(pagas.length / contas.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : contas.length === 0 ? (
        <div className="text-center py-12">
          <CalendarClock className="h-10 w-10 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-slate-500 font-semibold">Nenhuma conta fixa</p>
          <p className="text-sm text-slate-400">Adicione aluguel, luz, funcionários…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contas.map(c => {
            const st = statusConta(c.dia_vencimento, !!c.pagamento?.pago);
            const dias = diasParaVencer(c.dia_vencimento);
            const { label, cls } = STATUS_STYLE[st];
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Toggle pagamento */}
                  <button onClick={() => togglePagamento(c)} className="shrink-0 transition hover:scale-110">
                    {c.pagamento?.pago
                      ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                      : <Circle className="h-6 w-6 text-slate-300" />}
                  </button>

                  {/* Infos */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.nome}</p>
                    <p className="text-xs text-slate-400">{c.categoria} · vence dia {c.dia_vencimento}</p>
                  </div>

                  {/* Valor */}
                  <div className="shrink-0 text-right mr-1">
                    <p className="text-sm font-black text-slate-800">{formatBRL(c.valor)}</p>
                    <p className="text-[11px] text-slate-400">/mês</p>
                  </div>

                  {/* Delete */}
                  <button onClick={() => deletar(c.id)} className="shrink-0 p-1 text-slate-200 hover:text-red-500 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Status bar */}
                <div className={`flex items-center gap-1.5 px-4 py-2 border-t border-slate-50 ${cls}`}>
                  {st === "vencida" && <AlertTriangle className="h-3.5 w-3.5" />}
                  {st === "avencer" && <Clock className="h-3.5 w-3.5" />}
                  {st === "paga" && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {st === "pendente" && <Circle className="h-3.5 w-3.5" />}
                  <span className="text-xs font-bold">
                    {label}
                    {st === "avencer" && dias === 0 && " — Vence hoje!"}
                    {st === "avencer" && dias > 0 && ` — em ${dias} dia${dias > 1 ? "s" : ""}`}
                    {st === "vencida" && ` — há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}`}
                  </span>
                  {!c.pagamento?.pago && (
                    <button
                      onClick={() => togglePagamento(c)}
                      className="ml-auto text-xs font-black underline underline-offset-2 hover:no-underline"
                    >
                      Marcar como paga
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="w-full max-w-xl rounded-t-3xl bg-white p-6 shadow-2xl" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">Nova conta fixa</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nome da conta</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Aluguel, Energia, Funcionário…"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Valor (R$)</label>
                  <input type="number" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
                    placeholder="0,00" step="0.01" min="0.01"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dia vencimento</label>
                  <input type="number" value={diaVencimento} onChange={e => setDiaVencimento(e.target.value)}
                    min="1" max="31"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Categoria</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option value="">Selecione…</option>
                  {CATEGORIAS_CONTA_FIXA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button onClick={salvar} disabled={salvando || !nome || !valor || !categoria}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {salvando ? "Salvando…" : "Adicionar conta fixa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
