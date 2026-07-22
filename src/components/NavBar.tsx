"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Wallet, CalendarClock, BarChart2, LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard",    label: "Início",       Icon: LayoutDashboard },
  { href: "/caixa",        label: "Caixa",        Icon: Wallet },
  { href: "/contas-fixas", label: "Contas Fixas", Icon: CalendarClock },
];

export default function NavBar() {
  const { empresa, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Top header */}
      <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-5"
        style={{
          background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
          height: "calc(3.5rem + env(safe-area-inset-top, 0px))",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}>
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-white/15 flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-black text-white tracking-tight text-sm">COTAZ</span>
          {empresa && (
            <span className="hidden sm:inline text-blue-200 text-xs font-medium truncate max-w-[160px]">
              · {empresa.nome}
            </span>
          )}
        </div>
        <button onClick={signOut}
          className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-white transition">
          <LogOut className="h-3.5 w-3.5" /> Sair
        </button>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-100 nav-bottom">
        <div className="flex max-w-lg mx-auto">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 transition ${active ? "text-blue-900" : "text-slate-400 hover:text-slate-600"}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-2xl transition ${active ? "bg-blue-100" : "bg-transparent"}`}>
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
                </div>
                <span className={`text-[10px] font-bold ${active ? "text-blue-900" : "text-slate-400"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
