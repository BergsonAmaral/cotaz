"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BarChart2, Eye, EyeOff, Loader2 } from "lucide-react";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const router = useRouter();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) { setErro("A senha precisa ter ao menos 6 caracteres."); return; }
    setLoading(true);
    setErro("");

    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error || !data.user) {
      setErro(error?.message === "User already registered"
        ? "Este e-mail já está cadastrado. Faça login."
        : "Erro ao criar conta. Tente novamente.");
      setLoading(false);
      return;
    }

    const { error: perfilErr } = await supabase.from("empresa_perfis").insert({
      id: data.user.id,
      nome: nome.trim(),
      telefone: telefone.trim() || null,
    });

    if (perfilErr) {
      setErro("Conta criada, mas houve um erro ao salvar o perfil. Tente fazer login.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-950 px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg">
          <BarChart2 className="h-9 w-9 text-blue-900" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">COTAZ</h1>
          <p className="text-sm text-blue-300 mt-0.5">Crie sua conta gratuitamente</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="text-xl font-black text-slate-900 mb-1">Cadastrar empresa</h2>
        <p className="text-sm text-slate-500 mb-6">Preencha os dados abaixo para começar</p>

        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Nome da empresa *</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Restaurante do João"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Telefone / WhatsApp</label>
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="(88) 99999-9999"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="sua@empresa.com"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Senha *</label>
            <div className="relative mt-1">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{erro}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-3 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Criando conta…" : "Criar conta grátis"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta?{" "}
          <Link href="/" className="font-bold text-blue-800 hover:underline">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
