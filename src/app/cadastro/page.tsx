"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BarChart2, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

const INPUT = "w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400";

export default function CadastroPage() {
  const [nome,  setNome]  = useState("");
  const [tel,   setTel]   = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [show,  setShow]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro,  setErro]  = useState("");
  const router = useRouter();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) { setErro("Senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true); setErro("");

    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error || !data.user) {
      setErro(error?.message?.includes("already") ? "E-mail já cadastrado." : "Erro ao criar conta.");
      setLoading(false); return;
    }

    await supabase.from("empresa_perfis").insert({
      id: data.user.id, nome: nome.trim(), telefone: tel.trim() || null,
    });

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: "linear-gradient(145deg, #eff6ff 0%, #f8fafc 60%, #f1f5f9 100%)" }}>

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
            <BarChart2 className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">COTAZ</h1>
          <p className="text-sm text-slate-500 mt-1">Crie sua conta gratuitamente</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/80 p-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-700 transition mb-5 w-fit">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>

          <h2 className="text-lg font-black text-slate-800 mb-6">Criar conta</h2>

          <form onSubmit={handleCadastro} className="flex flex-col gap-4">

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Nome da empresa</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                required placeholder="Ex: Açaí Self, Loja do João…"
                className={INPUT} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                Telefone <span className="normal-case font-normal text-slate-400">(opcional)</span>
              </label>
              <input type="tel" value={tel} onChange={e => setTel(e.target.value)}
                placeholder="(88) 99999-9999"
                className={INPUT} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="voce@empresa.com"
                className={INPUT} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Senha</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)}
                  required placeholder="Mínimo 6 caracteres"
                  className={INPUT + " pr-11"} />
                <button type="button" onClick={() => setShow(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {erro && (
              <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-4 py-2.5">{erro}</p>
            )}

            <button type="submit" disabled={loading}
              className="mt-1 w-full rounded-xl py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Criando conta…" : "Criar conta grátis"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Já tem conta?{" "}
          <Link href="/" className="font-bold text-blue-700 hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
