"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  formatBRL, mesAnoAtual, labelMesAno, primeiroDia, ultimoDia,
  proximoMes, mesAnterior, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA,
} from "@/lib/utils";
import type { Transacao } from "@/types";
import {
  TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight,
  Plus, Trash2, X, Loader2,
} from "lucide-react";

function agruparPorData(transacoes: Transacao[]) {
  const map = new Map<string, Transacao[]>();
  [...transacoes]
    .sort((a, b) => b.data.localeCompare(a.data))
    .forEach(t => {
      const arr = map.get(t.data) ?? [];
      arr.push(t);
      map.set(t.data, arr);
    });
  return map;
}

export default function CaixaPage() {
  const { user } = useAuth();
  const [mesAno, setMesAno] = useState(mesAnoAtual());
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => { if (user) load(); }, [user, mesAno]);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase
      .from("caixa_transacoes")
      .select("*")
      .eq("empresa_id", user!.id)
      .gte("data", primeiroDia(mesAno))
      .lte("data", ultimoDia(mesAno))
      .order("data", { ascending: false });
    setTransacoes((rows ?? []) as Transacao[]);
    setLoading(false);
  }

  async function salvar() {
    if (!valor || !categoria) return;
    const num = parseFloat(valor.replace(",", "."));
    if (isNaN(num) || num <= 0) return;
    setSalvando(true);
    const { error } = await supabase.from("caixa_transacoes").insert({
      empresa_id: user!.id,
      tipo,
      valor: num,
      categoria,
      descricao: descricao.trim() || null,
      data,
    });
    if (!error) {
      setShowForm(false);
      setValor(""); setCategoria(""); setDescricao("");
      setTipo("entrada");
      setData(new Date().toISOString().split("T")[0]);
      load();
    }
    setSalvando(false);
  }

  async function deletar(id: string) {
    if (!confirm("Excluir esta movimentação?")) return;
    await supabase.from("caixa_transacoes").delete().eq("id", id);
    setTransacoes(prev => prev.filter(t => t.id !== id));
  }

  const totalEntradas = transacoes.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;
  const grupos = agruparPorData(transacoes);
  const cats = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;

  return (
    <div className="mx-auto max-w-xl px-4 py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-900" />
          <h1 className="text-xl font-black text-slate-900">Caixa</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-900 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-800 transition"
        >
          <Plus className="h-4 w-4" /> Lançar
        </button>
      </div>

      {/* Seletor de mês */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
        <button onClick={() => setMesAno(mesAnterior(mesAno))} className="p-1 rounded-lg hover:bg-slate-100 transition">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </button>
        <span className="text-sm font-black text-slate-800">{labelMesAno(mesAno)}</span>
        <button
          onClick={() => setMesAno(proximoMes(mesAno))}
          disabled={mesAno >= mesAnoAtual()}
          className="p-1 rounded-lg hover:bg-slate-100 transition disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`col-span-3 rounded-2xl p-4 text-white ${saldo >= 0 ? "bg-blue-900" : "bg-red-600"}`}>
          <p className="text-xs font-semibold opacity-70 mb-1">Saldo</p>
          <p className="text-2xl font-black">{formatBRL(saldo)}</p>
        </div>
        <div className="col-span-1 rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <TrendingUp className="h-4 w-4 text-emerald-500 mb-1" />
          <p className="text-[11px] text-slate-400 font-semibold">Entradas</p>
          <p className="text-sm font-black text-emerald-600">{formatBRL(totalEntradas)}</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-white border border-slate-100 p-3 shadow-sm">
          <TrendingDown className="h-4 w-4 text-red-400 mb-1" />
          <p className="text-[11px] text-slate-400 font-semibold">Saídas</p>
          <p className="text-sm font-black text-red-500">{formatBRL(totalSaidas)}</p>
        </div>
      </div>

      {/* Lista de transações */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : transacoes.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="h-10 w-10 text-slate-200 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-slate-500 font-semibold">Nenhuma movimentação</p>
          <p className="text-sm text-slate-400">Clique em "Lançar" para registrar.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[...grupos.entries()].map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <div className="flex flex-col gap-2">
                {items.map(t => (
                  <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.tipo === "entrada" ? "bg-emerald-50" : "bg-red-50"}`}>
                      {t.tipo === "entrada"
                        ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                        : <TrendingDown className="h-4 w-4 text-red-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{t.descricao || t.categoria}</p>
                      <p className="text-xs text-slate-400 truncate">{t.categoria}</p>
                    </div>
                    <span className={`shrink-0 font-black text-sm ${t.tipo === "entrada" ? "text-emerald-600" : "text-red-500"}`}>
                      {t.tipo === "entrada" ? "+" : "-"}{formatBRL(t.valor)}
                    </span>
                    <button onClick={() => deletar(t.id)} className="shrink-0 p-1 text-slate-300 hover:text-red-500 transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal / Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div ref={formRef} className="w-full max-w-xl rounded-t-3xl bg-white p-6 shadow-2xl pb-safe" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-900">Novo lançamento</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tipo */}
            <div className="flex gap-2 mb-4">
              {(["entrada", "saida"] as const).map(t => (
                <button key={t} onClick={() => { setTipo(t); setCategoria(""); }}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tipo === t
                    ? t === "entrada" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    : "bg-slate-100 text-slate-500"}`}>
                  {t === "entrada" ? "↑ Entrada" : "↓ Saída"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {/* Valor */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Valor (R$)</label>
                <input type="number" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
                  placeholder="0,00" step="0.01" min="0.01"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-black text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>

              {/* Categoria */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Categoria</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option value="">Selecione…</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descrição (opcional)</label>
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
                  placeholder="Ex: Venda balcão manhã"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>

              {/* Data */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Data</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              </div>

              <button onClick={salvar} disabled={salvando || !valor || !categoria}
                className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50">
                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {salvando ? "Salvando…" : "Salvar lançamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
