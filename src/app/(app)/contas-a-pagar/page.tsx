"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatBRL, statusContaPagar, diasParaData, CATEGORIAS_SAIDA } from "@/lib/utils";
import type { ContaPagar } from "@/types";
import {
  Plus, X, Loader2, AlertTriangle, Clock, CheckCircle2,
  Circle, Check, Trash2, CalendarDays, Building2,
} from "lucide-react";

const STATUS = {
  paga:     { label: "Paga",        cls: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
  vencida:  { label: "Vencida",     cls: "text-red-600",     bg: "bg-red-50 border-red-100" },
  avencer:  { label: "A vencer",    cls: "text-amber-600",   bg: "bg-amber-50 border-amber-100" },
  pendente: { label: "Pendente",    cls: "text-slate-500",   bg: "bg-slate-50 border-slate-100" },
};

const INPUT = "w-full rounded-2xl border-2 border-transparent bg-slate-100 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white";

function fmtData(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

type Filtro = "pendentes" | "vencidas" | "pagas" | "todas";

export default function ContasPagarPage() {
  const { user } = useAuth();
  const [contas, setContas]   = useState<ContaPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro]   = useState<Filtro>("pendentes");

  // Sheet: nova conta
  const [sheet, setSheet]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [valor, setValor]   = useState("");
  const [cat, setCat]       = useState("");
  const [venc, setVenc]     = useState("");

  // Sheet: confirmar pagamento
  const [pagando, setPagando]       = useState<ContaPagar | null>(null);
  const [lancarCaixa, setLancarCaixa] = useState(true);
  const [dataPag, setDataPag]       = useState(new Date().toISOString().slice(0, 10));
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("caixa_contas_pagar").select("*")
      .eq("empresa_id", user!.id)
      .order("data_vencimento", { ascending: true });
    setContas((data ?? []) as ContaPagar[]);
    setLoading(false);
  }

  async function salvar() {
    const num = parseFloat(valor.replace(",", "."));
    if (!descricao || !cat || isNaN(num) || num <= 0 || !venc) return;
    setSaving(true);
    const { error } = await supabase.from("caixa_contas_pagar").insert({
      empresa_id: user!.id,
      descricao: descricao.trim(),
      fornecedor: fornecedor.trim() || null,
      valor: num,
      data_vencimento: venc,
      categoria: cat,
    });
    if (!error) {
      setSheet(false);
      setDescricao(""); setFornecedor(""); setValor(""); setCat(""); setVenc("");
      load();
    }
    setSaving(false);
  }

  async function confirmarPagamento() {
    if (!pagando) return;
    setConfirmando(true);

    await supabase.from("caixa_contas_pagar").update({
      pago: true,
      data_pagamento: dataPag,
      lancou_caixa: lancarCaixa,
    }).eq("id", pagando.id);

    if (lancarCaixa) {
      await supabase.from("caixa_transacoes").insert({
        empresa_id: user!.id,
        tipo: "saida",
        valor: pagando.valor,
        categoria: pagando.categoria,
        descricao: pagando.descricao + (pagando.fornecedor ? ` — ${pagando.fornecedor}` : ""),
        data: dataPag,
      });
    }

    setPagando(null);
    setConfirmando(false);
    setLancarCaixa(true);
    setDataPag(new Date().toISOString().slice(0, 10));
    load();
  }

  async function desfazerPagamento(c: ContaPagar) {
    await supabase.from("caixa_contas_pagar").update({
      pago: false, data_pagamento: null, lancou_caixa: false,
    }).eq("id", c.id);
    load();
  }

  async function deletar(id: string) {
    if (!confirm("Excluir esta conta?")) return;
    await supabase.from("caixa_contas_pagar").delete().eq("id", id);
    setContas(p => p.filter(c => c.id !== id));
  }

  const pendentes  = contas.filter(c => !c.pago);
  const vencidas   = contas.filter(c => statusContaPagar(c.data_vencimento, c.pago) === "vencida");
  const totalPend  = pendentes.reduce((s, c) => s + c.valor, 0);
  const totalVenc  = vencidas.reduce((s, c) => s + c.valor, 0);

  const filtradas = contas.filter(c => {
    const st = statusContaPagar(c.data_vencimento, c.pago);
    if (filtro === "pendentes") return !c.pago;
    if (filtro === "vencidas")  return st === "vencida";
    if (filtro === "pagas")     return c.pago;
    return true;
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-5 flex flex-col gap-4 fade-in">

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-xl"
        style={{ background: vencidas.length > 0
          ? "linear-gradient(135deg, #991b1b 0%, #dc2626 100%)"
          : "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
        <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute right-4 -bottom-8 h-24 w-24 rounded-full bg-white/5" />

        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-60 mb-1">Contas a Pagar</p>
            <p className="text-3xl font-black">{formatBRL(totalPend)}</p>
            <p className="text-xs opacity-50 mt-1">{pendentes.length} conta{pendentes.length !== 1 ? "s" : ""} pendente{pendentes.length !== 1 ? "s" : ""}</p>
          </div>
          <CalendarDays className="h-5 w-5 opacity-40 mt-1" />
        </div>

        {vencidas.length > 0 && (
          <div className="mt-2 flex items-center gap-2 bg-white/15 rounded-2xl px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-xs font-bold">
              {vencidas.length} vencida{vencidas.length > 1 ? "s" : ""} · {formatBRL(totalVenc)} em atraso
            </p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {([
          { k: "pendentes", label: "Pendentes" },
          { k: "vencidas",  label: "Vencidas" },
          { k: "pagas",     label: "Pagas" },
          { k: "todas",     label: "Todas" },
        ] as { k: Filtro; label: string }[]).map(({ k, label }) => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`flex-1 rounded-2xl py-2 text-[11px] font-bold transition ${filtro === k
              ? k === "vencidas" ? "bg-red-500 text-white"
              : k === "pagas"   ? "bg-emerald-500 text-white"
              : "bg-blue-900 text-white"
              : "bg-white text-slate-500 border border-slate-100"}`}>
            {label}
          </button>
        ))}
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
              <div className="h-9 w-9 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="h-16 w-16 rounded-3xl bg-slate-100 flex items-center justify-center">
            <CalendarDays className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="font-bold text-slate-600">
            {filtro === "pagas" ? "Nenhuma conta paga ainda" : "Nenhuma conta pendente"}
          </p>
          <p className="text-sm text-slate-400">
            {filtro === "pagas" ? "Pague uma conta para ela aparecer aqui" : "Use o botão + para adicionar"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtradas.map(c => {
            const st   = statusContaPagar(c.data_vencimento, c.pago);
            const dias = diasParaData(c.data_vencimento);
            const { label, cls, bg } = STATUS[st];

            return (
              <div key={c.id} className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4">
                  {/* Ícone */}
                  <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${c.pago ? "bg-emerald-50" : "bg-slate-100"}`}>
                    <Building2 className={`h-5 w-5 ${c.pago ? "text-emerald-500" : "text-slate-400"}`} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-black truncate ${c.pago ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {c.descricao}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {c.fornecedor && (
                        <p className="text-xs text-slate-400 truncate">{c.fornecedor}</p>
                      )}
                      {c.fornecedor && <span className="text-slate-200 text-xs">·</span>}
                      <p className="text-xs text-slate-400">{c.categoria}</p>
                    </div>
                  </div>

                  {/* Valor + data */}
                  <div className="shrink-0 text-right mr-1">
                    <p className={`text-sm font-black ${c.pago ? "text-slate-400 line-through" : "text-slate-800"}`}>
                      {formatBRL(c.valor)}
                    </p>
                    <p className="text-[10px] text-slate-400">{fmtData(c.data_vencimento)}</p>
                  </div>

                  {/* Toggle pago */}
                  <button
                    onClick={() => c.pago ? desfazerPagamento(c) : setPagando(c)}
                    className={`shrink-0 h-9 w-9 flex items-center justify-center rounded-full border-2 transition ${
                      c.pago
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                        : "border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-400"
                    }`}>
                    {c.pago ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </button>

                  {/* Deletar */}
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
                    {st === "pendente" && <Clock className="h-3.5 w-3.5" />}
                    <span className="text-xs font-bold">
                      {st === "paga"     && `Paga em ${fmtData(c.data_pagamento!)}`}
                      {st === "vencida"  && `Vencida há ${Math.abs(dias)} dia${Math.abs(dias) > 1 ? "s" : ""}`}
                      {st === "avencer"  && (dias === 0 ? "Vence hoje!" : `Vence em ${dias} dia${dias > 1 ? "s" : ""}`)}
                      {st === "pendente" && `Vence em ${dias} dia${dias > 1 ? "s" : ""}`}
                    </span>
                  </div>
                  {!c.pago && (
                    <button onClick={() => setPagando(c)}
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
        className="fixed right-4 z-30 h-14 w-14 rounded-full bg-blue-900 text-white shadow-xl shadow-blue-900/40 flex items-center justify-center hover:bg-blue-800 active:scale-95 transition"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}>
        <Plus className="h-6 w-6" />
      </button>

      {/* Sheet — nova conta */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm fade-in"
          onClick={e => { if (e.target === e.currentTarget) setSheet(false); }}>
          <div className="w-full max-w-lg bg-white rounded-t-[2rem] px-6 pt-4 shadow-2xl slide-up overflow-y-auto"
            style={{ maxHeight: "92dvh", paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 0px))" }}>

            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-900">Nova conta a pagar</h2>
              <button onClick={() => setSheet(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Descrição</label>
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
                  placeholder="Ex: Pedido de acaí, Frete, Embalagens…"
                  className={"mt-1 " + INPUT} />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Fornecedor <span className="normal-case font-normal text-slate-400">(opcional)</span>
                </label>
                <input type="text" value={fornecedor} onChange={e => setFornecedor(e.target.value)}
                  placeholder="Nome do fornecedor"
                  className={"mt-1 " + INPUT} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Valor (R$)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input type="number" inputMode="decimal" value={valor} onChange={e => setValor(e.target.value)}
                      placeholder="0,00" step="0.01" min="0.01"
                      className={INPUT + " pl-9 font-bold"} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Vencimento</label>
                  <input type="date" value={venc} onChange={e => setVenc(e.target.value)}
                    className={"mt-1 " + INPUT} />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Categoria</label>
                <select value={cat} onChange={e => setCat(e.target.value)} className={"mt-1 " + INPUT}>
                  <option value="">Selecione…</option>
                  {CATEGORIAS_SAIDA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button onClick={salvar} disabled={saving || !descricao || !valor || !cat || !venc}
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-900 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/25 hover:bg-blue-800 active:scale-[0.98] transition disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                {saving ? "Salvando…" : "Adicionar conta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet — confirmar pagamento */}
      {pagando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm fade-in"
          onClick={e => { if (e.target === e.currentTarget) setPagando(null); }}>
          <div className="w-full max-w-lg bg-white rounded-t-[2rem] px-6 pt-4 shadow-2xl slide-up overflow-y-auto"
            style={{ maxHeight: "80dvh", paddingBottom: "max(2.5rem, env(safe-area-inset-bottom, 0px))" }}>

            <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-black text-slate-900">Confirmar pagamento</h2>
              <button onClick={() => setPagando(null)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Resumo da conta */}
            <div className="bg-slate-50 rounded-2xl px-4 py-3.5 mb-5">
              <p className="text-sm font-black text-slate-800">{pagando.descricao}</p>
              {pagando.fornecedor && <p className="text-xs text-slate-500 mt-0.5">{pagando.fornecedor}</p>}
              <p className="text-2xl font-black text-blue-900 mt-2">{formatBRL(pagando.valor)}</p>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Data do pagamento</label>
                <input type="date" value={dataPag} onChange={e => setDataPag(e.target.value)}
                  className={"mt-1 " + INPUT} />
              </div>

              {/* Toggle lançar no caixa */}
              <button onClick={() => setLancarCaixa(v => !v)}
                className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 transition ${
                  lancarCaixa ? "border-blue-600 bg-blue-50" : "border-transparent bg-slate-100"
                }`}>
                <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                  lancarCaixa ? "bg-blue-600 border-blue-600" : "border-slate-300"
                }`}>
                  {lancarCaixa && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">Lançar saída no Caixa</p>
                  <p className="text-xs text-slate-400">Registra automaticamente em Saídas</p>
                </div>
              </button>

              <button onClick={confirmarPagamento} disabled={confirmando}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 active:scale-[0.98] transition disabled:opacity-60">
                {confirmando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {confirmando ? "Confirmando…" : "Confirmar pagamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
