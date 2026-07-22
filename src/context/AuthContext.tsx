"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Empresa } from "@/types";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  empresa: Empresa | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx>({
  user: null, session: null, empresa: null, loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchEmpresa(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchEmpresa(session.user.id);
      else { setEmpresa(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchEmpresa(id: string) {
    const { data } = await supabase.from("empresa_perfis").select("*").eq("id", id).single();
    setEmpresa(data ?? null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, session, empresa, loading, signOut: async () => { await supabase.auth.signOut(); } }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
