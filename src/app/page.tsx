"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2, BarChart2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [show, setShow]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro]   = useState("");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) router.push("/dashboard");
  }, [user, authLoading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErro("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) { setErro("E-mail ou senha incorretos."); setLoading(false); }
    else router.push("/dashboard");
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Loader2 className="h-7 w-7 text-white animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">

      {/* Topo decorativo */}
      <div className="flex-1 flex flex-col items-center justify-end pb-10 px-6 pt-16"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #1e3a8a 0%, #0f172a 70%)" }}>

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40">
              <BarChart2 className="h-10 w-10 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-slate-950" />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-white tracking-tighter">COTAZ</h1>
            <p className="text-sm text-slate-400 mt-1">Controle financeiro para sua empresa</p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-t-[2rem] bg-white px-6 pt-8 pb-10 shadow-2xl slide-up">
        <h2 className="text-2xl font-black text-slate-900 mb-1">Bem-vindo de volta</h2>
        <p className="text-sm text-slate-500 mb-7">Entre na sua conta para continuar</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="voce@empresa.com"
              className="w-full rounded-2xl border-2 border-transparent bg-slate-100 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Senha</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)} required
                placeholder="••••••••"
                className="w-full rounded-2xl border-2 border-transparent bg-slate-100 px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white"
              />
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {erro}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-blue-900 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-800 active:scale-[0.98] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-bold text-blue-700 hover:underline">Cadastre-se grátis</Link>
        </p>
      </div>
    </div>
  );
}
