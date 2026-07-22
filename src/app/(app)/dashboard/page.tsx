"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatBRL, mesAnoAtual, labelMesAno, primeiroDia, ultimoDia, statusConta, diasParaVencer } from "@/lib/utils";
import type { Transacao, ContaFixaComStatus } from "@/types";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  CalendarClock, ArrowRight, Clock,
} from "lucide-react";
import Link from "next/link";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`} />;
}

export default function DashboardPage() {
  const { user, empresa } = useAuth();
  const [trans, setTrans]   = useState<Transacao[]>([]);
  const [contas, setContas] = useState<ContaFixaComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const mesAno = mesAnoAtual();

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    const [{ data: t }, { data: f }, { data: p }] = await Promise.all([
      supabase.from("caixa_transacoes").select("*")
        .eq("empresa_id", user!.id).gte("data", primeiroDia(mesAno)).lte("data", ultimoDia(mesAno)),
      supabase.from("caixa_contas_fixas").select("*")
        .eq("empresa_id", user!.id).eq("ativa", true).order("dia_vencimento"),
      supabase.from("caixa_pagamentos").select("*")
        .eq("empresa_id", user!.id).eq("mes_ano", mesAno),
    ]);
    setTrans((t ?? []) as Transacao[]);
    setContas(((f ?? []) as ContaFixaComStatus[]).map(c => ({
      ...c, pagamento: p?.find(pg => pg.conta_fixa_id === c.id),
    })));
    setLoading(false);
  }

  const entradas = trans.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const saidas   = trans.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const saldo    = entradas - saidas;

  const alertas  = contas.filter(c => {
    const st = statusConta(c.dia_vencimento, !!c.pagamento?.pago);
    return st === "vencida" || st === "avencer";
  });
  const pagas     = contas.filter(c => c.pagamento?.pago);
  const totalFixas = contas.reduce((s, c) => s + c.valor, 0);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const recentes = [...trans].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  return (
    <div className="mx-auto max-w-lg px-4 py-5 flex flex-col gap-4 fade-in">

      {/* Saudação */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{saudacao} 👋</p>
          {loading
            ? <Skeleton className="mt-1 h-7 w-40" />
            : <h1 className="text-xl font-black text-slate-900 mt-0.5 truncate max-w-[220px]">
                {empresa?.nome ?? "Minha Empresa"}
              </h1>
          }
          <p className="text-xs text-slate-400">{labelMesAno(mesAno)}</p>
        </div>
      </div>

      {/* Hero — Saldo */}
      {loading ? <Skeleton className="h-36 w-full" /> : (
        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
          style={{ background: saldo >= 0
            ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
            : "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)" }}>
          {/* Decoration */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -right-2 -bottom-10 h-28 w-28 rounded-full bg-white/5" />

          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-1">Saldo do mês</p>
          <p className="text-4xl font-black tracking-tight">{formatBRL(saldo)}</p>
          <p className="text-xs opacity-50 mt-1">{labelMesAno(mesAno)}</p>

          <div className="mt-5 flex gap-6">
            <div>
              <p className="text-[11px] opacity-50 uppercase tracking-wide font-semibold">Entradas</p>
              <p className="text-sm font-black text-emerald-300">+{formatBRL(entradas)}</p>
            </div>
            <div className="w-px bg-white/10" />
            <div>
              <p className="text-[11px] opacity-50 uppercase tracking-wide font-semibold">Saídas</p>
              <p className="text-sm font-black text-red-300">-{formatBRL(saidas)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alertas */}
      {!loading && alertas.length > 0 && (
        <div className="rounded-3xl bg-amber-50 border border-amber-200/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-3.5 w-3.5 text-white" />
            </div>
            <p className="text-sm font-black text-amber-800">
              {alertas.length === 1 ? "1 conta precisa de atenção" : `${alertas.length} contas precisam de atenção`}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {alertas.slice(0, 3).map(c => {
              const st   = statusConta(c.dia_vencimento, !!c.pagamento?.pago);
              const dias = diasParaVencer(c.dia_vencimento);
              return (
                <div key={c.id} className="flex items-center justify-between bg-white rounded-2xl px-4 py-2.5 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{c.nome}</p>
                    <p className="text-xs text-slate-400">{formatBRL(c.valor)} · dia {c.dia_vencimento}</p>
                  </div>
                  <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                    st === "vencida" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                    {st === "vencida" ? "Vencida" : dias === 0 ? "Hoje!" : `${dias}d`}
                  </span>
                </div>
              );
            })}
          </div>
          <Link href="/contas-fixas" className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline w-fit">
            Ver todas <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Contas Fixas — progresso */}
      {!loading && (
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <CalendarClock className="h-4 w-4 text-blue-700" />
              </div>
              <p className="text-sm font-black text-slate-800">Contas Fixas</p>
            </div>
            <Link href="/contas-fixas"
              className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-0.5">
              Gerenciar <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {contas.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">Nenhuma conta fixa cadastrada.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-slate-600">
                    <span className="font-black text-emerald-600">{pagas.length}</span>
                    <span className="text-slate-400"> / {contas.length} pagas</span>
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {formatBRL(pagas.reduce((s, c) => s + c.valor, 0))} / {formatBRL(totalFixas)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${contas.length > 0 ? (pagas.length / contas.length) * 100 : 0}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-400 text-right">
                {contas.length - pagas.length} restante{contas.length - pagas.length !== 1 ? "s" : ""}
                {" "}· {formatBRL(totalFixas - pagas.reduce((s, c) => s + c.valor, 0))}
              </p>
            </>
          )}
        </div>
      )}

      {/* Últimas movimentações */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-slate-600" />
            </div>
            <p className="text-sm font-black text-slate-800">Últimas movimentações</p>
          </div>
          <Link href="/caixa" className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-0.5">
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : recentes.length === 0 ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-slate-500">Nenhuma movimentação</p>
            <p className="text-xs text-slate-400">Registre entradas e saídas no Caixa</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentes.map(t => (
              <div key={t.id} className="flex items-center gap-3">
                <CategoryIcon categoria={t.categoria} tipo={t.tipo} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{t.descricao || t.categoria}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {t.categoria} · {new Date(t.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-black ${t.tipo === "entrada" ? "text-emerald-600" : "text-red-500"}`}>
                  {t.tipo === "entrada" ? "+" : "−"}{formatBRL(t.valor)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
