"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  formatBRL, mesAnoAtual, labelMesAno, primeiroDia, ultimoDia, statusConta, diasParaVencer,
} from "@/lib/utils";
import type { Transacao, ContaFixaComStatus } from "@/types";
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle, CheckCircle2,
  CalendarClock, ArrowRight, Clock,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, empresa } = useAuth();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [contas, setContas] = useState<ContaFixaComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const mesAno = mesAnoAtual();

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    const [{ data: trans }, { data: fixas }, { data: pagamentos }] = await Promise.all([
      supabase.from("caixa_transacoes").select("*")
        .eq("empresa_id", user!.id)
        .gte("data", primeiroDia(mesAno))
        .lte("data", ultimoDia(mesAno)),
      supabase.from("caixa_contas_fixas").select("*")
        .eq("empresa_id", user!.id)
        .eq("ativa", true)
        .order("dia_vencimento"),
      supabase.from("caixa_pagamentos").select("*")
        .eq("empresa_id", user!.id)
        .eq("mes_ano", mesAno),
    ]);

    setTransacoes((trans ?? []) as Transacao[]);
    setContas(((fixas ?? []) as ContaFixaComStatus[]).map(c => ({
      ...c,
      pagamento: pagamentos?.find(p => p.conta_fixa_id === c.id),
    })));
    setLoading(false);
  }

  const totalEntradas = transacoes.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const saldo = totalEntradas - totalSaidas;

  const alertas = contas.filter(c => {
    const st = statusConta(c.dia_vencimento, !!c.pagamento?.pago);
    return st === "vencida" || st === "avencer";
  });

  const contasPagas = contas.filter(c => c.pagamento?.pago);
  const totalFixas = contas.reduce((s, c) => s + c.valor, 0);
  const totalFixasPagas = contasPagas.reduce((s, c) => s + c.valor, 0);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 flex flex-col gap-6">
      {/* Cabeçalho */}
      <div>
        <p className="text-sm text-slate-500">{saudacao},</p>
        <h1 className="text-2xl font-black text-slate-900">{empresa?.nome ?? "Empresa"}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{labelMesAno(mesAno)}</p>
      </div>

      {/* Cards financeiros */}
      <div className="grid grid-cols-1 gap-3">
        {/* Saldo */}
        <div className={`rounded-2xl p-5 text-white shadow ${saldo >= 0 ? "bg-blue-900" : "bg-red-600"}`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold opacity-80">Saldo do mês</p>
            <Wallet className="h-5 w-5 opacity-60" />
          </div>
          <p className="text-3xl font-black tracking-tight">{formatBRL(saldo)}</p>
          <p className="text-xs opacity-60 mt-1">{labelMesAno(mesAno)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-semibold text-slate-500">Entradas</p>
            </div>
            <p className="text-xl font-black text-emerald-600">{formatBRL(totalEntradas)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <p className="text-xs font-semibold text-slate-500">Saídas</p>
            </div>
            <p className="text-xl font-black text-red-500">{formatBRL(totalSaidas)}</p>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-bold text-amber-700">
              {alertas.length} conta{alertas.length > 1 ? "s" : ""} precisam de atenção
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {alertas.slice(0, 3).map(c => {
              const st = statusConta(c.dia_vencimento, !!c.pagamento?.pago);
              const dias = diasParaVencer(c.dia_vencimento);
              return (
                <div key={c.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-amber-100">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.nome}</p>
                    <p className="text-xs text-slate-500">{formatBRL(c.valor)} · dia {c.dia_vencimento}</p>
                  </div>
                  {st === "vencida" ? (
                    <span className="ml-2 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
                      Vencida
                    </span>
                  ) : (
                    <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                      {dias === 0 ? "Hoje!" : `${dias}d`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <Link href="/contas-fixas" className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline">
            Ver todas as contas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Resumo Contas Fixas */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-blue-700" />
            <p className="text-sm font-bold text-slate-800">Contas Fixas — {labelMesAno(mesAno)}</p>
          </div>
          <Link href="/contas-fixas" className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-0.5">
            Ver <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {contas.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma conta fixa cadastrada.</p>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-slate-600">
                  <span className="font-bold text-emerald-600">{contasPagas.length}</span> de {contas.length} pagas
                </span>
              </div>
              <span className="text-sm font-bold text-slate-700">{formatBRL(totalFixasPagas)} / {formatBRL(totalFixas)}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: contas.length > 0 ? `${(contasPagas.length / contas.length) * 100}%` : "0%" }}
              />
            </div>
          </>
        )}
      </div>

      {/* Últimas transações */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-bold text-slate-800">Últimas movimentações</p>
          </div>
          <Link href="/caixa" className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-0.5">
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {transacoes.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">Nenhuma movimentação este mês.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {[...transacoes]
              .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
              .slice(0, 5)
              .map(t => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{t.descricao || t.categoria}</p>
                    <p className="text-xs text-slate-400">{t.categoria} · {new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-black ${t.tipo === "entrada" ? "text-emerald-600" : "text-red-500"}`}>
                    {t.tipo === "entrada" ? "+" : "-"}{formatBRL(t.valor)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/caixa"
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-900 px-4 py-3 text-sm font-bold text-white shadow hover:bg-blue-800 transition">
          <Wallet className="h-4 w-4" /> Lançar no Caixa
        </Link>
        <Link href="/contas-fixas"
          className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition">
          <CalendarClock className="h-4 w-4" /> Contas Fixas
        </Link>
      </div>
    </div>
  );
}
