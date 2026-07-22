"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  formatBRL, mesAnoAtual, labelMesAno, primeiroDia, ultimoDia,
  proximoMes, mesAnterior,
} from "@/lib/utils";
import type { Transacao } from "@/types";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

type DiaResumo = {
  data: string;
  entradas: number;
  saidas: number;
  itens: Transacao[];
};

function fmtDia(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default function RelatorioPage() {
  const { user } = useAuth();
  const [mesAno, setMesAno] = useState(mesAnoAtual());
  const [dias, setDias] = useState<DiaResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) load(); }, [user, mesAno]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("caixa_transacoes").select("*")
      .eq("empresa_id", user!.id)
      .gte("data", primeiroDia(mesAno))
      .lte("data", ultimoDia(mesAno))
      .order("data", { ascending: false });

    const trans = (data ?? []) as Transacao[];
    const map = new Map<string, DiaResumo>();
    trans.forEach(t => {
      if (!map.has(t.data)) map.set(t.data, { data: t.data, entradas: 0, saidas: 0, itens: [] });
      const d = map.get(t.data)!;
      if (t.tipo === "entrada") d.entradas += t.valor;
      else d.saidas += t.valor;
      d.itens.push(t);
    });

    setDias([...map.values()].sort((a, b) => b.data.localeCompare(a.data)));
    setLoading(false);
  }

  const totalEntradas = dias.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas   = dias.reduce((s, d) => s + d.saidas, 0);
  const saldo         = totalEntradas - totalSaidas;

  return (
    <div className="mx-auto max-w-lg px-4 py-5 flex flex-col gap-4 fade-in">

      {/* Mês */}
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

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3.5">
          <TrendingUp className="h-4 w-4 text-emerald-500 mb-1.5" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Entradas</p>
          <p className="text-sm font-black text-emerald-600 mt-0.5">{formatBRL(totalEntradas)}</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3.5">
          <TrendingDown className="h-4 w-4 text-red-400 mb-1.5" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Saídas</p>
          <p className="text-sm font-black text-red-500 mt-0.5">{formatBRL(totalSaidas)}</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-3.5 ${saldo >= 0 ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"}`}>
          <div className={`h-4 w-4 mb-1.5 text-sm font-black ${saldo >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {saldo >= 0 ? "=" : "="}
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Saldo</p>
          <p className={`text-sm font-black mt-0.5 ${saldo >= 0 ? "text-blue-700" : "text-red-600"}`}>{formatBRL(saldo)}</p>
        </div>
      </div>

      {/* Por dia */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded-full w-1/3" />
              <div className="h-3 bg-slate-200 rounded-full w-2/3" />
              <div className="h-3 bg-slate-200 rounded-full w-1/2" />
            </div>
          ))}
        </div>
      ) : dias.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="font-bold text-slate-600">Sem movimentos</p>
          <p className="text-sm text-slate-400">{labelMesAno(mesAno)} não tem registros</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dias.map(d => {
            const saldoDia = d.entradas - d.saidas;
            return (
              <div key={d.data} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Cabeçalho do dia */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-600 capitalize">{fmtDia(d.data)}</p>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    saldoDia >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  }`}>
                    {saldoDia >= 0 ? "+" : ""}{formatBRL(saldoDia)}
                  </span>
                </div>

                {/* Itens do dia */}
                <div className="divide-y divide-slate-50">
                  {d.itens
                    .sort((a, b) => a.tipo.localeCompare(b.tipo))
                    .map(t => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                        <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                          t.tipo === "entrada" ? "bg-emerald-50" : "bg-red-50"
                        }`}>
                          {t.tipo === "entrada"
                            ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                            : <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{t.descricao || t.categoria}</p>
                          <p className="text-xs text-slate-400 truncate">{t.categoria}</p>
                        </div>
                        <span className={`shrink-0 text-sm font-black ${
                          t.tipo === "entrada" ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {t.tipo === "entrada" ? "+" : "−"}{formatBRL(t.valor)}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Barra entradas vs saídas */}
                {(d.entradas > 0 || d.saidas > 0) && (
                  <div className="flex h-1">
                    <div className="bg-emerald-400 transition-all"
                      style={{ width: `${d.entradas / (d.entradas + d.saidas) * 100}%` }} />
                    <div className="bg-red-400 flex-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
