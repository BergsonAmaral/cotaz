"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  formatBRL, mesAnoAtual, labelMesAno, primeiroDia, ultimoDia,
  proximoMes, mesAnterior, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA,
} from "@/lib/utils";
import type { Transacao } from "@/types";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, X, Loader2, TrendingUp, TrendingDown,
} from "lucide-react";

function agrupar(list: Transacao[]) {
  const m = new Map<string, Transacao[]>();
  [...list].sort((a, b) => b.data.localeCompare(a.data))
    .forEach(t => { const arr = m.get(t.data) ?? []; arr.push(t); m.set(t.data, arr); });
  return m;
}

const INPUT = "w-full rounded-2xl border-2 border-transparent bg-slate-100 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white";

export default function CaixaPage() {
  const { user } = useAuth();
  const [mesAno, setMesAno] = useState(mesAnoAtual());
  const [trans, setTrans]   = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "entrada" | "saida">("todos");

  const [tipo, setTipo]       = useState<"entrada" | "saida">("entrada");
  const [valor, setValor]     = useState("");
  const [cat, setCat]         = useState("");
  const [desc, setDesc]       = useState("");
  const [data, setData]       = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { if (user) load(); }, [user, mesAno]);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase.from("caixa_transacoes").select("*")
      .eq("empresa_id", user!.id)
      .gte("data", primeiroDia(mesAno)).lte("data", ultimoDia(mesAno))
      .order("data", { ascending: false });
    setTrans((rows ?? []) as Transacao[]);
    setLoading(false);
  }

  async function salvar() {
    const num = parseFloat(valor.replace(",", "."));
    if (!cat || isNaN(num) || num <= 0) return;
    setSaving(true);
    const { error } = await supabase.from("caixa_transacoes").insert({
      empresa_id: user!.id, tipo, valor: num,
      categoria: cat, descricao: desc.trim() || null, data,
    });
    if (!error) {
      setSheet(false); setValor(""); setCat(""); setDesc("");
      setTipo("entrada"); setData(new Date().toISOString().slice(0, 10));
      load();
    }
    setSaving(false);
  }

  async function deletar(id: string) {
    if (!confirm("Excluir esta movimentação?")) return;
    await supabase.from("caixa_transacoes").delete().eq("id", id);
    setTrans(p => p.filter(t => t.id !== id));
  }

  const filtradas = filtro === "todos" ? trans : trans.filter(t => t.tipo === filtro);
  const entradas  = trans.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const saidas    = trans.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const saldo     = entradas - saidas;
  const grupos    = agrupar(filtradas);
  const cats      = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  function fmtDia(d: string) {
    return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-5 flex flex-col gap-4 fade-in">

      {/* Mês selector */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
        <button onClick={() => setMesAno(mesAnterior(mesAno))}
          className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <span className="text-sm font-black text-slate-800">{labelMesAno(mesAno)}</span>
        <button onClick={() => setMesAno(proximoMes(mesAno))} disabled={mesAno >= mesAnoAtual()}
          className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition disabled:opacity-30">
          <ChevronRight className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className={`col-span-3 rounded-3xl p-4 text-white shadow-lg ${saldo >= 0 ? "bg-gradient-to-br from-blue-900 to-blue-700" : "bg-gradient-to-br from-red-700 to-red-500"}`}>
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Saldo</p>
          <p className="text-2xl font-black">{formatBRL(saldo)}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3.5">
          <TrendingUp className="h-4 w-4 text-emerald-500 mb-1.5" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Entradas</p>
          <p className="text-sm font-black text-emerald-600 mt-0.5">{formatBRL(entradas)}</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-white border border-slate-100 shadow-sm p-3.5">
          <TrendingDown className="h-4 w-4 text-red-400 mb-1.5" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Saídas</p>
          <p className="text-sm font-black text-red-500 mt-0.5">{formatBRL(saidas)}</p>
        </div>
      </div>

      {/* Filtro */}
      <div className="flex gap-2">
        {(["todos", "entrada", "saida"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`flex-1 rounded-2xl py-2 text-xs font-bold transition ${filtro === f
              ? f === "entrada" ? "bg-emerald-500 text-white"
              : f === "saida"  ? "bg-red-500 text-white"
              : "bg-blue-900 text-white"
              : "bg-white text-slate-500 border border-slate-100"}`}>
            {f === "todos" ? "Todos" : f === "entrada" ? "↑ Entradas" : "↓ Saídas"}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-11 w-11 rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-200 rounded-full w-3/4" />
                <div className="h-3 bg-slate-200 rounded-full w-1/2" />
              </div>
              <div className="h-4 w-16 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="font-bold text-slate-600">Nenhuma movimentação</p>
          <p className="text-sm text-slate-400">Use o botão + para registrar</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {[...grupos.entries()].map(([date, items]) => (
            <div key={date}>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2.5">{fmtDia(date)}</p>
              <div className="flex flex-col gap-1">
                {items.map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 group">
                    <CategoryIcon categoria={t.categoria} tipo={t.tipo} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{t.descricao || t.categoria}</p>
                      <p className="text-xs text-slate-400 truncate">{t.categoria}</p>
                    </div>
                    <span className={`shrink-0 font-black text-sm ${t.tipo === "entrada" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.tipo === "entrada" ? "+" : "−"}{formatBRL(t.valor)}
                    </span>
                    <button onClick={() => deletar(t.id)}
                      className="shrink-0 h-7 w-7 flex items-center justify-center rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
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

            {/* Drag handle */}
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-200" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-900">Novo lançamento</h2>
              <button onClick={() => setSheet(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tipo toggle */}
            <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-2xl">
              {(["entrada", "saida"] as const).map(t => (
                <button key={t} onClick={() => { setTipo(t); setCat(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition ${
                    tipo === t
                      ? t === "entrada" ? "bg-emerald-500 text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                      : "text-slate-500"}`}>
                  {t === "entrada" ? <><TrendingUp className="h-4 w-4" /> Entrada</> : <><TrendingDown className="h-4 w-4" /> Saída</>}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Valor */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Valor</label>
                <div className="relative mt-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                  <input type="number" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
                    placeholder="0,00" step="0.01" min="0.01"
                    className={INPUT + " pl-10 text-xl font-black"} />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Categoria</label>
                <select value={cat} onChange={e => setCat(e.target.value)} className={"mt-1 " + INPUT}>
                  <option value="">Selecione a categoria…</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Descrição <span className="normal-case font-normal">(opcional)</span></label>
                <input type="text" value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Ex: Venda do almoço"
                  className={"mt-1 " + INPUT} />
              </div>

              {/* Data */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Data</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className={"mt-1 " + INPUT} />
              </div>

              <button onClick={salvar} disabled={saving || !valor || !cat}
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-900 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/25 hover:bg-blue-800 active:scale-[0.98] transition disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Salvando…" : "Confirmar lançamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
