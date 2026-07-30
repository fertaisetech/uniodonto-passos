import { Mail, Pencil, Plus, Search, Trash2, Briefcase, ArrowUpDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Member } from "../Configuracoes";

type SortField = "name" | "role" | "status" | null;

type Props = {
  members: Member[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onAdd: () => void;
  onEdit: (member: Member) => void;
  onDelete: (memberId: string) => void;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (value: number) => void;
  sortField: SortField;
  sortDirection: "asc" | "desc";
  setSortField: (field: Exclude<SortField, null>) => void;
  setSortDirection: (direction: "asc" | "desc") => void;
};

const getInitials = (name: string) => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function UsersManagementSection({
  members,
  searchQuery,
  setSearchQuery,
  onAdd,
  onEdit,
  onDelete,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  sortField,
  sortDirection,
  setSortField,
  setSortDirection,
}: Props) {
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSort = (field: Exclude<SortField, null>) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (!sortField) return 0;
    const valA = (a[sortField] || "").toLowerCase();
    const valB = (b[sortField] || "").toLowerCase();
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totalItems = sortedMembers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedMembers = sortedMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 animate-[fadeIn_0.15s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-800">Contas e Membros Ativos</h2>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Configure quem possui acesso de visualização ou administração técnica e de segurança do portal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              className="pl-9 pr-8 py-1.5 w-full sm:w-[220px] text-xs bg-slate-50 focus:bg-white border border-slate-300 focus:border-[#CD176D] focus:ring-2 focus:ring-[#CD176D]/15 rounded-xl outline-none transition-all placeholder:text-slate-500 font-bold text-slate-800"
              placeholder="Pesquisar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer rounded-full"
                title="Limpar pesquisa"
                aria-label="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="bg-[#CD176D] text-white hover:bg-[#A60069] transition-all rounded-xl px-4 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-100 focus:outline-none focus:ring-2 focus:ring-[#CD176D]/35"
            title="Cadastrar Novo Usuário"
            aria-label="Adicionar Novo Usuário"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-black text-slate-700 uppercase tracking-wider">
              <th
                onClick={() => handleSort("name")}
                className="pb-3 font-semibold cursor-pointer select-none hover:text-[#CD176D] transition-colors"
                role="button"
                aria-label="Ordenar por nome"
              >
                <div className="flex items-center gap-1">
                  <span>Membro</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </th>
              <th
                onClick={() => handleSort("role")}
                className="pb-3 font-semibold md:table-cell cursor-pointer select-none hover:text-[#CD176D] transition-colors"
                role="button"
                aria-label="Ordenar por cargo"
              >
                <div className="flex items-center gap-1">
                  <span>Cargo / Função</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="pb-3 font-semibold text-center cursor-pointer select-none hover:text-[#CD176D] transition-colors"
                role="button"
                aria-label="Ordenar por status"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
              </th>
              <th className="pb-3 font-semibold text-right select-none">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {paginatedMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-xs text-slate-500 font-bold select-none">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border border-amber-100">
                      <Search className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <span className="block text-slate-800 text-sm font-black mb-1">Nenhum Usuário Encontrado</span>
                      <span className="block text-[#64748B] text-xs font-semibold max-w-[280px] mx-auto">
                        Nenhuma conta ou membro ativo corresponde à sua pesquisa de "<span className="text-[#CD176D]">{searchQuery}</span>".
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-xs bg-slate-105 hover:bg-slate-200 text-slate-800 border border-slate-300 font-extrabold px-3 py-1.5 rounded-lg transition-all"
                    >
                      Limpar Busca
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      {member.isPhoto && member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${member.avatarBgColor} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
                          {getInitials(member.name)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm block">{member.name}</span>
                        <span className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 md:table-cell">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200/40 rounded-lg text-[11px] font-bold">
                      <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                      <span>{member.role}</span>
                    </div>
                  </td>

                  <td className="py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>{member.status}</span>
                    </div>
                  </td>

                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(member)}
                        className="p-2 text-slate-600 hover:text-[#CD176D] bg-slate-100 hover:bg-[#CD176D]/5 rounded-full border border-slate-200/50 transition-all focus:ring-2 focus:ring-[#CD176D]/20 cursor-pointer shadow-sm"
                        title={`Editar membro ${member.name}`}
                        aria-label={`Editar membro ${member.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(member.id)}
                        className="p-2 text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-full border border-slate-200/50 transition-all focus:ring-2 focus:ring-red-200 cursor-pointer shadow-sm"
                        title={`Remover membro ${member.name}`}
                        aria-label={`Remover membro ${member.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-4 border-t border-slate-100 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-bold">Itens por página:</span>
          <select
            className="text-xs font-extrabold border border-slate-200 rounded-lg p-1 bg-white outline-none cursor-pointer focus:border-[#CD176D]"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Registros por página"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-xs text-slate-600 font-semibold ml-2">
            Exibindo {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(totalItems, currentPage * itemsPerPage)} de {totalItems}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`w-7.5 h-7.5 flex items-center justify-center rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                currentPage === page
                  ? "bg-[#CD176D] border-[#CD176D] text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              aria-label={`Ir para página ${page}`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
