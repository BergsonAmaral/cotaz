"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatBRL, mesAnoAtual, labelMesAno, primeiroDia, ultimoDia, statusConta, diasParaVencer } from "@/lib/utils";
import type { Transacao, ContaFixaComStatus } from "@/types";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
  CalendarClock, ArrowRight, Clock, Target, Pencil, X, Loader2,
} from "lucide-react";
import Link from "next/link";

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200 ${className}`} />;
}

type MesData = { label: string; key: string; entradas: number; saidas: number };

function BarChart({ data }: { data: MesData[] }) {
  const maxVal = Math.max(...data.flatMap(m => [m.entradas, m.saidas]), 1);
  const H = 80;
  const W = 300;
  const groupW = W / 6;
  const barW = 14;
  const gap = 4;
  const offset = (groupW - barW * 2 - gap) / 2;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="w-full" preserveAspectRatio="none">
        {/* Zero line */}
        <line x1={0} y1={H} x2={W} y2={H} stroke="#e2e8f0" strokeWidth={1} />

        {data.map((m, i) => {
          const x0 = i * groupW;
          const eH = (m.entradas / maxVal) * H;
          const sH = (m.saidas / maxVal) * H;
          const cx = x0 + groupW / 2;
          return (
            <g key={m.key}>
              {eH > 0 && (
                <rect x={x0 + offset} y={H - eH} width={barW} height={eH} rx={3} fill="#10b981" opacity={0.85} />
              )}
              {sH > 0 && (
                <rect x={x0 + offset + barW + gap} y={H - sH} width={barW} height={sH} rx={3} fill="#f87171" opacity={0.85} />
              )}
              <text x={cx} y={H + 15} textAnchor="middle" fontSize={9} fill="#94a3b8" fontWeight="700">
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legenda */}
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
          <span className="text-[10px] font-bold text-slate-400">Entradas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-red-400" />
          <span className="text-[10px] font-bold text-slate-400">Saídas</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, empresa } = useAuth();
  const [trans, setTrans]     = useState<Transacao[]>([]);
  const [contas, setContas]   = useState<ContaFixaComStatus[]>([]);
  const [chart, setChart]     = useState<MesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta]       = useState(0);
  const [editMeta, setEditMeta] = useState(false);
  const [metaInput, setMetaInput] = useState("");
  const mesAno = mesAnoAtual();

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`cotaz_meta_${user.id}`);
      if (saved) setMeta(parseFloat(saved));
      load();
    }
  }, [user]);

  async function load() {
    // Compute start of 6-months-ago window
    const now = new Date();
    const sixAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixAgoStr = `${sixAgo.getFullYear()}-${String(sixAgo.getMonth() + 1).padStart(2, "0")}-01`;

    const [{ data: t }, { data: f }, { data: p }, { data: c }] = await Promise.all([
      supabase.from("caixa_transacoes").select("*")
        .eq("empresa_id", user!.id).gte("data", primeiroDia(mesAno)).lte("data", ultimoDia(mesAno)),
      supabase.from("caixa_contas_fixas").select("*")
        .eq("empresa_id", user!.id).eq("ativa", true).order("dia_vencimento"),
      supabase.from("caixa_pagamentos").select("*")
        .eq("empresa_id", user!.id).eq("mes_ano", mesAno),
      supabase.from("caixa_transacoes").select("data, tipo, valor")
        .eq("empresa_id", user!.id).gte("data", sixAgoStr),
    ]);

    setTrans((t ?? []) as Transacao[]);
    setContas(((f ?? []) as ContaFixaComStatus[]).map(ct => ({
      ...ct, pagamento: p?.find(pg => pg.conta_fixa_id === ct.id),
    })));

    // Build chart data: last 6 months
    const byMonth = new Map<string, { entradas: number; saidas: number }>();
    (c ?? []).forEach((r: { data: string; tipo: string; valor: number }) => {
      const key = r.data.slice(0, 7);
      const m = byMonth.get(key) ?? { entradas: 0, saidas: 0 };
      if (r.tipo === "entrada") m.entradas += r.valor;
      else m.saidas += r.valor;
      byMonth.set(key, m);
    });

    const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
    const chartArr: MesData[] = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { key, label: meses[d.getMonth()], ...(byMonth.get(key) ?? { entradas: 0, saidas: 0 }) };
    });
    setChart(chartArr);
    setLoading(false);
  }

  function salvarMeta() {
    const val = parseFloat(metaInput.replace(",", "."));
    if (!isNaN(val) && val >= 0) {
      localStorage.setItem(`cotaz_meta_${user!.id}`, val.toString());
      setMeta(val);
    }
    setEditMeta(false);
    setMetaInput("");
  }

  const entradas  = trans.filter(t => t.tipo === "entrada").reduce((s, t) => s + t.valor, 0);
  const saidas    = trans.filter(t => t.tipo === "saida").reduce((s, t) => s + t.valor, 0);
  const saldo     = entradas - saidas;
  const alertas   = contas.filter(c => ["vencida","avencer"].includes(statusConta(c.dia_vencimento, !!c.pagamento?.pago)));
  const pagas     = contas.filter(c => c.pagamento?.pago);
  const totalFixas = contas.reduce((s, c) => s + c.valor, 0);
  const pctMeta   = meta > 0 ? Math.min((entradas / meta) * 100, 100) : 0;
  const hora      = new Date().getHours();
  const saudacao  = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const recentes  = [...trans].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);

  return (
    <div className="mx-auto max-w-lg px-4 py-5 flex flex-col gap-4 fade-in">

      {/* Saudação */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{saudacao} 👋</p>
        {loading
          ? <Skeleton className="mt-1 h-7 w-40" />
          : <h1 className="text-xl font-black text-slate-900 mt-0.5 truncate">{empresa?.nome ?? "Minha Empresa"}</h1>
        }
        <p className="text-xs text-slate-400">{labelMesAno(mesAno)}</p>
      </div>

      {/* Hero — Saldo */}
      {loading ? <Skeleton className="h-36 w-full" /> : (
        <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
          style={{ background: saldo >= 0
            ? "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)"
            : "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)" }}>
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

      {/* Meta de faturamento */}
      {!loading && (
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-sm font-black text-slate-800">Meta de Faturamento</p>
            </div>
            <button onClick={() => { setMetaInput(meta > 0 ? meta.toString() : ""); setEditMeta(true); }}
              className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline">
              <Pencil className="h-3 w-3" />{meta > 0 ? "Editar" : "Definir"}
            </button>
          </div>

          {meta > 0 ? (
            <>
              <div className="flex items-end justify-between mb-2">
                <p className="text-xl font-black text-slate-900">{formatBRL(entradas)}</p>
                <p className="text-xs text-slate-400 mb-0.5">de {formatBRL(meta)}</p>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pctMeta}%`,
                    background: entradas >= meta
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : "linear-gradient(90deg, #7c3aed, #a78bfa)",
                  }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {entradas >= meta
                  ? `Meta atingida! Superou em ${formatBRL(entradas - meta)}`
                  : `Faltam ${formatBRL(meta - entradas)} · ${Math.round(pctMeta)}% concluído`
                }
              </p>
            </>
          ) : (
            <button onClick={() => { setMetaInput(""); setEditMeta(true); }}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-sm text-slate-400 font-semibold hover:border-purple-300 hover:text-purple-600 transition">
              Toque para definir a meta mensal
            </button>
          )}
        </div>
      )}

      {/* Gráfico 6 meses */}
      {!loading && chart.length > 0 && (
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-700" />
              </div>
              <p className="text-sm font-black text-slate-800">Últimos 6 meses</p>
            </div>
          </div>
          <BarChart data={chart} />
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

      {/* Contas Fixas progresso */}
      {!loading && (
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <CalendarClock className="h-4 w-4 text-blue-700" />
              </div>
              <p className="text-sm font-black text-slate-800">Contas Fixas</p>
            </div>
            <Link href="/contas-fixas" className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-0.5">
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
            {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
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

      {/* Modal editar meta */}
      {editMeta && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm fade-in"
          onClick={e => { if (e.target === e.currentTarget) setEditMeta(false); }}>
          <div className="w-full max-w-lg bg-white rounded-t-[2rem] px-6 pt-4 slide-up overflow-y-auto"
            style={{ maxHeight: "60dvh", paddingBottom: "max(2rem, env(safe-area-inset-bottom, 0px))" }}>
            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-900">Meta de faturamento</h2>
              <button onClick={() => setEditMeta(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Valor da meta (R$)</label>
            <div className="relative mt-1 mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
              <input
                type="number" inputMode="decimal" value={metaInput}
                onChange={e => setMetaInput(e.target.value)}
                placeholder="5000,00" step="0.01" min="0" autoFocus
                className="w-full rounded-2xl border-2 border-transparent bg-slate-100 px-4 py-3.5 pl-10 text-xl font-black text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-purple-500 focus:bg-white"
              />
            </div>
            <button onClick={salvarMeta}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <Target className="h-4 w-4" /> Salvar meta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
