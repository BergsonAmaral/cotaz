"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BarChart2, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

export default function CadastroPage() {
  const [nome, setNome]     = useState("");
  const [tel, setTel]       = useState("");
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro]     = useState("");
  const router = useRouter();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) { setErro("Senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true); setErro("");

    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error || !data.user) {
      setErro(error?.message?.includes("already") ? "E-mail já cadastrado. Faça login." : "Erro ao criar conta. Tente novamente.");
      setLoading(false); return;
    }

    await supabase.from("empresa_perfis").insert({
      id: data.user.id, nome: nome.trim(), telefone: tel.trim() || null,
    });

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <div className="flex-1 flex flex-col items-center justify-end pb-8 px-6 pt-12"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #1e3a8a 0%, #0f172a 70%)" }}>
        <div className="mb-4 flex flex-col items-center gap-3">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/40">
            <BarChart2 className="h-8 w-8 text-white" strokeWidth={2} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black text-white tracking-tighter">COTAZ</h1>
            <p className="text-sm text-slate-400 mt-0.5">Crie sua conta e comece agora</p>
          </div>
        </div>
      </div>

      <div className="rounded-t-[2rem] bg-white px-6 pt-7 pb-10 shadow-2xl slide-up">
        <Link href="/" className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-700 transition w-fit">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h2 className="text-2xl font-black text-slate-900 mb-1">Criar conta</h2>
        <p className="text-sm text-slate-500 mb-6">Gratuito e sem cartão de crédito</p>

        <form onSubmit={handleCadastro} className="flex flex-col gap-3.5">
          {[
            { label: "Nome da empresa", value: nome, set: setNome, type: "text",  placeholder: "Ex: Loja do João", required: true  },
            { label: "Telefone / WhatsApp", value: tel, set: setTel, type: "tel", placeholder: "(88) 99999-9999", required: false },
            { label: "E-mail",          value: email, set: setEmail, type: "email", placeholder: "voce@empresa.com", required: true },
          ].map(({ label, value, set, type, placeholder, required }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
              <input type={type} value={value} onChange={e => set(e.target.value)} required={required}
                placeholder={placeholder}
                className="w-full rounded-2xl border-2 border-transparent bg-slate-100 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white" />
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Senha</label>
            <div className="relative">
              <input type={show ? "text" : "password"} value={senha} onChange={e => setSenha(e.target.value)} required
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-2xl border-2 border-transparent bg-slate-100 px-4 py-3.5 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-600 focus:bg-white" />
              <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />{erro}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-blue-900 py-4 text-sm font-bold text-white shadow-lg shadow-blue-900/30 transition hover:bg-blue-800 active:scale-[0.98] disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Criando conta…" : "Criar conta grátis"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/" className="font-bold text-blue-700 hover:underline">Fazer login</Link>
        </p>
      </div>
    </div>
  );
}
