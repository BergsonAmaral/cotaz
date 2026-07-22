"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Wallet, CalendarClock, BarChart2, LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/caixa", label: "Caixa", Icon: Wallet },
  { href: "/contas-fixas", label: "Contas Fixas", Icon: CalendarClock },
];

export default function NavBar() {
  const { empresa, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {/* Header top */}
      <header className="fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between bg-blue-950 px-4 shadow-md">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-white" strokeWidth={1.75} />
          <span className="font-black text-white tracking-tight">COTAZ</span>
          {empresa && (
            <>
              <span className="text-blue-400 mx-1">·</span>
              <span className="text-sm text-blue-200 truncate max-w-[140px]">{empresa.nome}</span>
            </>
          )}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-300 hover:text-white transition"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-200 bg-white">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition ${
                active ? "text-blue-900" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-blue-900" : ""}`} strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
