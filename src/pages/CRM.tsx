import { Filter, Plus, Search, Users } from "lucide-react";

export function CRM() {
  return (
    <div className="dashboard-content space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#CD176D]">Relacionamento</p>
          <h1 className="text-2xl font-black text-text-primary">CRM</h1>
          <p className="mt-1 text-sm text-text-secondary">Gestão de contatos, oportunidades e relacionamento.</p>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-xl bg-[#CD176D] px-4 py-2 text-xs font-black text-white shadow-sm hover:bg-[#A60069]"><Plus className="h-4 w-4" /> Novo contato</button>
      </div>
      <div className="glass-card flex items-center gap-3 p-4">
        <Search className="h-4 w-4 text-text-secondary" />
        <input className="flex-1 bg-transparent text-sm outline-none" placeholder="Buscar contato ou oportunidade" />
        <button type="button" className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-secondary"><Filter className="h-4 w-4" /> Filtros</button>
      </div>
      <div className="glass-card flex min-h-[280px] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-2xl bg-pink-50 p-4 text-[#CD176D]"><Users className="h-7 w-7" /></div>
        <h2 className="mt-4 text-base font-black text-text-primary">Nenhum contato cadastrado</h2>
        <p className="mt-1 max-w-md text-sm text-text-secondary">Comece adicionando um contato para acompanhar seu relacionamento.</p>
      </div>
    </div>
  );
}
