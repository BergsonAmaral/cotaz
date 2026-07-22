"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  formatBRL, mesAnoAtual, labelMesAno, statusConta, diasParaVencer, CATEGORIAS_CONTA_FIXA,
} from "@/lib/utils";
import type { ContaFixa, ContaFixaComStatus, PagamentoConta } from "@/types";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  CalendarClock, Plus, CheckCircle2, Circle, Trash2, X,
  Loader2, AlertTriangle, Clock, Check,
} from "lucide-react";

const STATUS = {
  paga:     { label: "Paga",        cls: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
  vencida:  { label: "Vencida",     cls: "text-red-600",     bg: "bg-red-50 border-red-100" },
  avencer:  { label: "A vencer",    cls: "text-amber-600",   bg: "bg-amber-50 border-amber-100" },
  pendente: { label: "Pendente",    cls: "text-slate-500",   bg: "bg-slate-50 border-slate-100" },
};

const INPUT = "w-full rounded-2xl border-2 border-transparent bg-slate-100 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white";

export default function ContasFixasPage() {
  const { user } = useAuth();
  const [contas, setContas] = useState<ContaFixaComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const mesAno = mesAnoAtual();

  const [nome, setNome]   = useState("");
  const [valor, setValor] = useState("");
  const [dia, setDia]     = useState("5");
  const [cat, setCat]     = useState("");

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    const [{ data: f }, { data: p }] = await Promise.all([
      supabase.from("caixa_contas_fixas").select("*")
        .eq("empresa_id", user!.id).eq("ativa", true).order("dia_vencimento"),
      supabase.from("caixa_pagamentos").select("*")
        .eq("empresa_id", user!.id).eq("mes_ano", mesAno),
    ]);
    setContas(((f ?? []) as ContaFixa[]).map(c => ({
      ...c, pagamento: (p as PagamentoConta[] | null)?.find(pg => pg.conta_fixa_id === c.id),
    })));
    setLoading(false);
  }

  async function salvar() {
    const num = parseFloat(valor.replace(",", "."));
    if (!nome || !cat || isNaN(num) || num <= 0) return;
    setSaving(true);
    const { error } = await supabase.from("caixa_contas_fixas").insert({
      empresa_id: user!.id, nome: nome.trim(), valor: num,
      dia_vencimento: parseInt(dia), categoria: cat,
    });
    if (!error) {
      setSheet(false); setNome(""); setValor(""); setDia("5"); setCat("");
      load();
    }
    setSaving(false);
  }

  async function toggle(c: ContaFixaComStatus) {
    setToggling(c.id);
    const pago = !!c.pagamento?.pago;
    if (pago) {
      await supabase.from("caixa_pagamentos").update({ pago: false, data_pagamento: null }).eq("id", c.pagamento!.id);
    } else if (c.pagamento) {
      await supabase.from("caixa_pagamentos").update({ pago: true, data_pagamento: new Date().toISOString().slice(0, 10) }).eq("id", c.pagamento.id);
    } else {
      await supabase.from("caixa_pagamentos").insert({
        conta_fixa_id: c.id, empresa_id: user!.id, mes_ano: mesAno,
        pago: true, data_pagamento: new Date().toISOString().slice(0, 10),
      });
    }
    await load();
    setToggling(null);
  }

  async function deletar(id: string) {
    if (!confirm("Excluir esta conta fixa?")) return;
    await supabase.from("caixa_contas_fixas").update({ ativa: false }).eq("id", id);
    setContas(p => p.filter(c => c.id !== id));
  }

  const pagas      = contas.filter(c => c.pagamento?.pago);
  const totalFixas = contas.reduce((s, c) => s + c.valor, 0);
  const totalPagas = pagas.reduce((s, c) => s + c.valor, 0);
  const pct        = contas.length > 0 ? (pagas.length / contas.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-5 flex flex-col gap-4 fade-in">

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 to-blue-700 p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-4 -bottom-8 h-24 w-24 rounded-full bg-white/5" />

        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Contas Fixas</p>
            <p className="text-sm font-semibold opacity-80">{labelMesAno(mesAno)}</p>
          </div>
          <CalendarClock className="h-5 w-5 opacity-40" />
        </div>

        {contas.length === 0 ? (
          <p className="text-sm opacity-60">Nenhuma conta fixa cadastrada.</p>
        ) : (
          <>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-3xl font-black">{pagas.length}<span className="text-lg opacity-50">/{contas.length}</span></p>
                <p className="text-xs opacity-50 mt-0.5">contas pagas</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black">{formatBRL(totalPagas)}</p>
                <p className="text-xs opacity-50">de {formatBRL(totalFixas)}</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs opacity-40 text-right">
              {contas.length - pagas.length} restante{contas.length - pagas.length !== 1 ? "s" : ""}
              {" · "}{formatBRL(totalFixas - totalPagas)} a pagar
            </p>
          </>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-11 w-11 rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded-full w-2/3" />
                <div className="h-3 bg-slate-200 rounded-full w-1/3" />
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      ) : contas.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center">
            <CalendarClock className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="font-bold text-slate-600">Nenhuma conta fixa</p>
          <p className="text-sm text-slate-400">Adicione aluguel, luz, funcionários…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {contas.map(c => {
            const st   = statusConta(c.dia_vencimento, !!c.pagamento?.pago);
            const dias = diasParaVencer(c.dia_vencimento);
            const { label, cls, bg } = STATUS[st];
            const pago = !!c.pagamento?.pago;

            return (
              <div key={c.id} className={`rounded-3xl bg-white border shadow-sm overflow-hidden transition-all ${pago ? "opacity-75" : ""}`}>
                <div className="flex items-center gap-3 px-4 py-4">
                  <CategoryIcon categoria={c.categoria} tipo="saida" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-black text-slate-800 truncate ${pago ? "line-through text-slate-400" : ""}`}>{c.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">{c.categoria}</p>
                      <span className="text-slate-200">·</span>
                      <p className="text-xs text-slate-400">vence dia {c.dia_vencimento}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right mr-2">
                    <p className={`text-sm font-black ${pago ? "text-slate-400 line-through" : "text-slate-800"}`}>{formatBRL(c.valor)}</p>
                    <p className="text-[10px] text-slate-400">/mês</p>
                  </div>

                  {/* Toggle */}
                  <button onClick={() => toggle(c)} disabled={toggling === c.id}
                    className={`shrink-0 h-9 w-9 flex items-center justify-center rounded-full border-2 transition ${
                      pago
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : "border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-400"
                    }`}>
                    {toggling === c.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : pago
                        ? <Check className="h-4 w-4" />
                        : <Circle className="h-4 w-4" />
                    }
                  </button>

                  <button onClick={() => deletar(c.id)}
                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-xl text-slate-200 hover:text-red-400 hover:bg-red-50 transition">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Status strip */}
                <div className={`flex items-center justify-between px-4 py-2.5 border-t ${bg}`}>
                  <div className={`flex items-center gap-1.5 ${cls}`}>
                    {st === "vencida"  && <AlertTriangle className="h-3.5 w-3.5" />}
                    {st === "avencer"  && <Clock className="h-3.5 w-3.5" />}
                    {st === "paga"     && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {st === "pendente" && <Circle className="h-3.5 w-3.5" />}
                    <span className="text-xs font-bold">
                      {label}
                      {st === "avencer"  && (dias === 0 ? " — Vence hoje!" : ` — em ${dias} dia${dias > 1 ? "s" : ""}`)}
                      {st === "vencida"  && ` — há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {!pago && (
                    <button onClick={() => toggle(c)}
                      className={`text-xs font-black ${cls} hover:underline`}>
                      Marcar como paga
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setSheet(true)}
        className="fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-blue-900 text-white shadow-xl shadow-blue-900/40 flex items-center justify-center hover:bg-blue-800 active:scale-95 transition">
        <Plus className="h-6 w-6" />
      </button>

      {/* Sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm fade-in"
          onClick={e => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="w-full max-w-lg bg-white rounded-t-[2rem] px-6 pt-4 pb-10 shadow-2xl slide-up"
            style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}>
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-200" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900">Nova conta fixa</h2>
              <button onClick={() => setSheet(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nome da conta</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Aluguel, Energia, Funcionário…"
                  className={"mt-1 " + INPUT} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Valor (R$)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input type="number" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
                      placeholder="0,00" step="0.01"
                      className={INPUT + " pl-9 font-bold"} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Dia vencimento</label>
                  <input type="number" value={dia} onChange={e => setDia(e.target.value)} min="1" max="31"
                    className={"mt-1 font-bold " + INPUT} />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Categoria</label>
                <select value={cat} onChange={e => setCat(e.target.value)} className={"mt-1 " + INPUT}>
                  <option value="">Selecione…</option>
                  {CATEGORIAS_CONTA_FIXA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button onClick={salvar} disabled={saving || !nome || !valor || !cat}
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-900 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/25 hover:bg-blue-800 active:scale-[0.98] transition disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                {saving ? "Salvando…" : "Adicionar conta fixa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
