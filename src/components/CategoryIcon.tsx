"use client";

import {
  Home, Zap, Droplets, Wifi, Users, Package, Megaphone,
  Truck, Wrench, FileText, Box, ShoppingBag, Bike,
  TrendingUp, TrendingDown, DollarSign, Receipt, Coffee,
  CreditCard, Building2,
} from "lucide-react";

type IconEntry = { Icon: React.ElementType; color: string; bg: string };

const MAP: Record<string, IconEntry> = {
  "Aluguel":                  { Icon: Home,        color: "text-blue-600",   bg: "bg-blue-100"   },
  "Energia elétrica":         { Icon: Zap,         color: "text-yellow-600", bg: "bg-yellow-100" },
  "Água / Saneamento":        { Icon: Droplets,    color: "text-cyan-600",   bg: "bg-cyan-100"   },
  "Água":                     { Icon: Droplets,    color: "text-cyan-600",   bg: "bg-cyan-100"   },
  "Internet / Telefone":      { Icon: Wifi,        color: "text-violet-600", bg: "bg-violet-100" },
  "Sistema / Assinatura":     { Icon: Wifi,        color: "text-violet-600", bg: "bg-violet-100" },
  "Salários / Funcionários":  { Icon: Users,       color: "text-indigo-600", bg: "bg-indigo-100" },
  "Funcionário":              { Icon: Users,       color: "text-indigo-600", bg: "bg-indigo-100" },
  "Fornecedor / Insumos":     { Icon: Package,     color: "text-orange-600", bg: "bg-orange-100" },
  "Marketing / Publicidade":  { Icon: Megaphone,   color: "text-pink-600",   bg: "bg-pink-100"   },
  "Transporte / Frete":       { Icon: Truck,       color: "text-slate-600",  bg: "bg-slate-100"  },
  "Manutenção":               { Icon: Wrench,      color: "text-stone-600",  bg: "bg-stone-100"  },
  "Impostos / Taxas":         { Icon: FileText,    color: "text-red-600",    bg: "bg-red-100"    },
  "Imposto":                  { Icon: FileText,    color: "text-red-600",    bg: "bg-red-100"    },
  "Financiamento":            { Icon: CreditCard,  color: "text-red-600",    bg: "bg-red-100"    },
  "Embalagens":               { Icon: Box,         color: "text-amber-600",  bg: "bg-amber-100"  },
  "Venda de produto":         { Icon: ShoppingBag, color: "text-emerald-600",bg: "bg-emerald-100"},
  "Prestação de serviço":     { Icon: Receipt,     color: "text-blue-600",   bg: "bg-blue-100"   },
  "Delivery":                 { Icon: Bike,        color: "text-orange-600", bg: "bg-orange-100" },
  "Investimento / Aporte":    { Icon: TrendingUp,  color: "text-green-600",  bg: "bg-green-100"  },
  "Outras receitas":          { Icon: DollarSign,  color: "text-emerald-600",bg: "bg-emerald-100"},
  "Outras despesas":          { Icon: DollarSign,  color: "text-red-600",    bg: "bg-red-100"    },
  "Receita de delivery":      { Icon: Bike,        color: "text-orange-600", bg: "bg-orange-100" },
  "Receita de aluguel":       { Icon: Building2,   color: "text-blue-600",   bg: "bg-blue-100"   },
};

export function CategoryIcon({
  categoria,
  tipo,
  size = "md",
}: {
  categoria: string;
  tipo?: "entrada" | "saida";
  size?: "sm" | "md";
}) {
  const entry = MAP[categoria] ?? (
    tipo === "entrada"
      ? { Icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-100" }
      : { Icon: TrendingDown, color: "text-red-500",     bg: "bg-red-100"     }
  );
  const { Icon, color, bg } = entry;
  const dim  = size === "sm" ? "h-8 w-8"  : "h-11 w-11";
  const icon = size === "sm" ? "h-4 w-4"  : "h-5 w-5";
  return (
    <div className={`shrink-0 flex items-center justify-center rounded-2xl ${dim} ${bg}`}>
      <Icon className={`${icon} ${color}`} strokeWidth={1.75} />
    </div>
  );
}
