"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2, BarChart2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [show,  setShow]  = useState(false);
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "linear-gradient(145deg, #eff6ff 0%, #f8fafc 60%, #f1f5f9 100%)" }}>

      {/* Card */}
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
            <BarChart2 className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">COTAZ</h1>
          <p className="text-sm text-slate-500 mt-1">Controle financeiro da sua empresa</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 p-8">
          <h2 className="text-lg font-black text-slate-800 mb-6">Entrar na conta</h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                E-mail
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="voce@empresa.com"
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                Senha
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)}
                  required placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 pr-11 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400"
                />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-4 py-2.5">{erro}</p>
            )}

            {/* Botão */}
            <button type="submit" disabled={loading}
              className="mt-1 w-full rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-bold text-blue-700 hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
