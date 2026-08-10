import { BarChart3, Plus, ShoppingCart, Target, TrendingUp } from "lucide-react";

export function AppVendas() {
  return (
    <div className="dashboard-content space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#CD176D]">Comercial</p>
          <h1 className="text-2xl font-black text-text-primary">App de Vendas</h1>
          <p className="mt-1 text-sm text-text-secondary">Acompanhe oportunidades, propostas e resultados comerciais.</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-xl bg-[#CD176D] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#A60069]"><Plus className="h-4 w-4" /> Nova oportunidade</button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[[Target, "Meta de vendas", "Acompanhe o objetivo do período"], [ShoppingCart, "Oportunidades", "Negociações em andamento"], [TrendingUp, "Desempenho", "Resultados da equipe comercial"]].map(([Icon, title, description]) => (
          <div key={title as string} className="glass-card flex items-center gap-4 p-5"><div className="rounded-xl bg-pink-50 p-3 text-[#CD176D]"><Icon className="h-5 w-5" /></div><div><h2 className="text-sm font-black text-text-primary">{title as string}</h2><p className="mt-1 text-xs text-text-secondary">{description as string}</p></div></div>
        ))}
      </div>
      <div className="glass-card flex min-h-[280px] flex-col items-center justify-center p-6 text-center"><div className="rounded-2xl bg-pink-50 p-4 text-[#CD176D]"><BarChart3 className="h-7 w-7" /></div><h2 className="mt-4 text-base font-black text-text-primary">App de Vendas pronto para configuração</h2><p className="mt-1 max-w-md text-sm text-text-secondary">Cadastre oportunidades e acompanhe o funil comercial nesta área.</p></div>
    </div>
  );
}
