import React, { useState } from "react";
import { 
  User, 
  Users, 
  Building2, 
  ShieldCheck, 
  Bell, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Mail, 
  Briefcase, 
  Check, 
  X, 
  Lock,
  Globe,
  MapPin,
  Phone,
  Eye,
  EyeOff,
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { useAppSession } from "../context/AppSessionContext";
import {
  deleteTeamMember,
  loadTeamMembers,
  observeTeamMembers,
  saveTeamMember,
  saveUserProfile,
  uploadTeamMemberPhoto,
  uploadUserProfilePhoto,
} from "../lib/firebase";
import { UsersManagementSection } from "./configuracoes/UsersManagementSection";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ATIVO" | "INATIVO";
  initials: string;
  avatarBgColor: string;
  isPhoto?: boolean;
  photoUrl?: string;
}

const defaultMembers: Member[] = [
  {
    id: "1",
    name: "FerTaise Tech Admin",
    email: "fe***********@gmail.com",
    role: "Tech FerTaise",
    status: "ATIVO",
    initials: "FT",
    avatarBgColor: "bg-[#A60069]",
  },
  {
    id: "2",
    name: "Dr. Elcio Beraldo",
    email: "el***@uniodonto.com",
    role: "Diretor",
    status: "ATIVO",
    initials: "EB",
    avatarBgColor: "bg-gray-400",
  },
  {
    id: "3",
    name: "Dr. Luiz Fernando",
    email: "lu**@uniodonto.com",
    role: "Diretor",
    status: "ATIVO",
    initials: "LF",
    avatarBgColor: "bg-gray-400",
  },
  {
    id: "4",
    name: "Dr. Mateus José",
    email: "ma****@uniodonto.com",
    role: "Diretor",
    status: "ATIVO",
    initials: "MJ",
    avatarBgColor: "bg-gray-400",
  },
  {
    id: "5",
    name: "Janaína Pádua",
    email: "ge*****@uniodonto.com",
    role: "Gerente",
    status: "ATIVO",
    initials: "JP",
    avatarBgColor: "bg-gray-400",
  },
  {
    id: "6",
    name: "test 1234",
    email: "te**@uniodontopassos.com",
    role: "Gerente",
    status: "ATIVO",
    initials: "T1",
    avatarBgColor: "bg-[#0088CC]",
  }
];

export function Configuracoes() {
  const { profile } = useAppSession();
  const [activeTab, setActiveTab] = useState<
    "perfil" | "usuarios" | "cooperativa" | "seguranca" | "alertas"
  >("usuarios");

  // State for Users Management
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>(defaultMembers);

  // Modal and Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("Gerente");
  const [formStatus, setFormStatus] = useState<"ATIVO" | "INATIVO">("ATIVO");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formPhoto, setFormPhoto] = useState<string | null>(null);
  const [formPhotoFile, setFormPhotoFile] = useState<File | null>(null);
  const [formScreens, setFormScreens] = useState({
    dashboard: true,
    relatorios: true,
    envio: true,
    configuracoes: true
  });

  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<"name" | "role" | "status" | null>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Deletion Modal State
  const [memberIdToDelete, setMemberIdToDelete] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Reset page when search or per-page limits change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Profile Form States
  const [profileName, setProfileName] = useState(profile?.name || "Admin Uniodonto");
  const [profileEmail, setProfileEmail] = useState(profile?.email || "contato@uniodontopassos.com");
  const [profilePhone, setProfilePhone] = useState(profile?.phone || "(35) 99888-7766");
  const [profilePassword, setProfilePassword] = useState("********");
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(profile?.photoUrl || null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Cooperativa Form States
  const [coopName, setCoopName] = useState("Uniodonto de Passos Cooperativa de Trabalho Odontológico");
  const [coopCNPJ, setCoopCNPJ] = useState("12.345.678/0001-90");
  const [coopAddress, setCoopAddress] = useState("Av. da Moda, 1200 - Passos/MG");
  const [coopPhone, setCoopPhone] = useState("(35) 3521-0000");
  const [coopSite, setCoopSite] = useState("www.uniodontopassos.com.br");
  const [isCoopSaved, setIsCoopSaved] = useState(false);

  // Security Form States
  const [apiKey] = useState(import.meta.env.VITE_SECURITY_API_KEY || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [ipWhitelist, setIpWhitelist] = useState("189.44.120.25, 200.150.12.3");
  const [twoFactor, setTwoFactor] = useState(true);
  const [isSecuritySaved, setIsSecuritySaved] = useState(false);

  // Alerts configuration
  const [alertMetaAdsMin, setAlertMetaAdsMin] = useState(true);
  const [alertDropInDailyLeads, setAlertDropInDailyLeads] = useState(true);
  const [alertEmailDailySummary, setAlertEmailDailySummary] = useState(false);
  const [alertWhatsAppCritical, setAlertWhatsAppCritical] = useState(true);
  const [isAlertsSaved, setIsAlertsSaved] = useState(false);

  React.useEffect(() => {
    if (!profile) return;
    setProfileName(profile.name || "");
    setProfileEmail(profile.email || "");
    setProfilePhone(profile.phone || "");
    setProfilePhotoPreview(profile.photoUrl || null);
  }, [profile]);

  React.useEffect(() => {
    let alive = true;

    const unsubscribe = observeTeamMembers(
      (remoteMembers) => {
        if (!alive) return;
        setMembers(remoteMembers.length > 0 ? remoteMembers : defaultMembers);
      },
      () => {
        if (!alive) return;
        setMembers(defaultMembers);
      }
    );

    void loadTeamMembers()
      .then((remoteMembers) => {
        if (!alive) return;
        setMembers(remoteMembers.length > 0 ? remoteMembers : defaultMembers);
      })
      .catch(() => {
        if (!alive) return;
        setMembers(defaultMembers);
      });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  // Filter members based on search
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormName("");
    setFormEmail("");
    setFormUsername("");
    setFormPassword("");
    setFormPhotoFile(null);
    setFormRole("Gerente");
    setFormStatus("ATIVO");
    setFormPhoto(null);
    setFormScreens({
      dashboard: true,
      relatorios: true,
      envio: true,
      configuracoes: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormName(member.name);
    
    // Get full emails instead of masked ones for editable states
    let fullEmail = member.email;
    if (member.email.includes("***")) {
      if (member.id === "1") fullEmail = "fe" + "rnando.daraujo10@gmail.com";
      else if (member.id === "2") fullEmail = "elcio@uniodonto.com";
      else if (member.id === "3") fullEmail = "luiz@uniodonto.com";
      else if (member.id === "4") fullEmail = "mateus@uniodonto.com";
      else if (member.id === "5") fullEmail = "janaina@uniodonto.com";
      else fullEmail = "user@uniodonto.com";
    }
    
    setFormEmail(fullEmail);
    setFormUsername(fullEmail);
    setFormPassword("");
    setFormPhotoFile(null);
    setFormRole(member.role);
    setFormStatus(member.status);
    setFormPhoto(member.isPhoto && member.photoUrl ? member.photoUrl : null);
    setFormScreens({
      dashboard: true,
      relatorios: true,
      envio: member.role !== "Diretor" && member.role !== "Tech FerTaise",
      configuracoes: member.role === "Tech FerTaise" || member.role === "Diretor"
    });
    setIsModalOpen(true);
  };

  const handleDeleteMemberAction = async (id: string) => {
    try {
      await deleteTeamMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setMemberIdToDelete(null);
      showToast("Usuário removido com sucesso!", "success");
    } catch (err) {
      showToast("Erro ao remover usuário, tente novamente", "error");
    }
  };

  const handleDeleteMember = (id: string) => {
    setMemberIdToDelete(id);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast("Erro ao salvar, tente novamente", "error");
      return;
    }

    (async () => {
      try {
        const memberId = editingMember?.id || Date.now().toString();
        const colors = ["bg-[#A60069]", "bg-[#0088CC]", "bg-purple-600", "bg-emerald-600", "bg-orange-600"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const initials = getInitials(formName);
        let photoUrl = formPhoto || undefined;

        if (formPhotoFile) {
          photoUrl = await uploadTeamMemberPhoto(memberId, formPhotoFile);
        }

        const nextMember: Member = {
          id: memberId,
          name: formName,
          email: formEmail,
          role: formRole,
          status: formStatus,
          initials,
          avatarBgColor: editingMember?.avatarBgColor || randomColor,
          isPhoto: !!photoUrl,
          photoUrl,
        };

        await saveTeamMember(nextMember);
        setMembers((prev) => {
          const withoutCurrent = prev.filter((m) => m.id !== memberId);
          return [...withoutCurrent, nextMember].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        });
        setIsModalOpen(false);
        showToast(editingMember ? "Usuário editado com sucesso!" : "Usuário adicionado com sucesso!", "success");
      } catch (err) {
        showToast("Erro ao salvar, tente novamente", "error");
      }
    })();
  };

  const renderLegacyUsersBlock = false;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8 min-h-screen">
      
      {/* Primary Flex Container for Sidebar + Main Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side Navigation (Opções do Painel) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-4">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-2">
            Opções do Painel
          </span>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("perfil")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "perfil"
                  ? "bg-[#A60069] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Meu Perfil Pessoal</span>
            </button>

            <button
              onClick={() => setActiveTab("usuarios")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "usuarios"
                  ? "bg-[#A60069] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Gerenciamento de Usuários</span>
            </button>

            <button
              onClick={() => setActiveTab("cooperativa")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "cooperativa"
                  ? "bg-[#A60069] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Perfil da Cooperativa</span>
            </button>

            <button
              onClick={() => setActiveTab("seguranca")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "seguranca"
                  ? "bg-[#A60069] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Segurança & API</span>
            </button>

            <button
              onClick={() => setActiveTab("alertas")}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "alertas"
                  ? "bg-[#A60069] text-white shadow-sm font-semibold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span>Notificações & Alertas</span>
            </button>
          </nav>
        </div>

        {/* Right Side Card Content Area */}
        <div className="lg:col-span-3">
          {activeTab === "usuarios" && (
            <UsersManagementSection
              members={members}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAdd={handleOpenAddModal}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteMember}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              sortField={sortField}
              sortDirection={sortDirection}
              setSortField={setSortField}
              setSortDirection={setSortDirection}
            />
          )}

          {/* Active Tab: Gerenciamento de Usuários (legacy block disabled during split) */}
          {renderLegacyUsersBlock && (() => {
            // Compute Sorting & Pagination right inside the tab scope for extreme modularity
            const handleSort = (field: "name" | "role" | "status") => {
              if (sortField === field) {
                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
              } else {
                setSortField(field);
                setSortDirection("asc");
              }
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
                
                {/* Card Header with alignment identical to user design template */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Contas e Membros Ativos</h2>
                    <p className="text-xs text-slate-600 font-medium mt-1">
                      Configure quem possui acesso de visualização ou administração técnica e de segurança do portal.
                    </p>
                  </div>
                  
                  {/* Search input + Add New User button */}
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
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer rounded-full"
                          title="Limpar pesquisa"
                          aria-label="Limpar pesquisa"
                          role="button"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    
                    <button
                      onClick={handleOpenAddModal}
                      className="bg-[#CD176D] text-white hover:bg-[#A60069] transition-all rounded-xl px-4 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-100 focus:outline-none focus:ring-2 focus:ring-[#CD176D]/35"
                      title="Cadastrar Novo Usuário"
                      aria-label="Adicionar Novo Usuário"
                      role="button"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Novo Usuário</span>
                    </button>
                  </div>
                </div>

                {/* Members Table */}
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
                                onClick={() => setSearchQuery("")}
                                className="text-xs bg-slate-105 hover:bg-slate-200 text-slate-800 border border-slate-300 font-extrabold px-3 py-1.5 rounded-lg transition-all"
                                role="button"
                              >
                                Limpar Busca
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50/70 transition-colors group">
                            {/* Member column (Avatar name and email) */}
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
                                    {member.initials}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                                    {member.name}
                                  </span>
                                  <span className="text-xs text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                                    <Mail className="w-3 h-3 text-slate-500" />
                                    {member.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Cargo Badge */}
                            <td className="py-4 md:table-cell">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200/40 rounded-lg text-[11px] font-bold">
                                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                                <span>{member.role}</span>
                              </div>
                            </td>

                            {/* Status Badge */}
                            <td className="py-4 text-center">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{member.status}</span>
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(member)}
                                  className="p-2 text-slate-600 hover:text-[#CD176D] bg-slate-100 hover:bg-[#CD176D]/5 rounded-full border border-slate-200/50 transition-all focus:ring-2 focus:ring-[#CD176D]/20 cursor-pointer shadow-sm"
                                  title={`Editar membro ${member.name}`}
                                  aria-label={`Editar membro ${member.name}`}
                                  role="button"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="p-2 text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-full border border-slate-200/50 transition-all focus:ring-2 focus:ring-red-200 cursor-pointer shadow-sm"
                                  title={`Remover membro ${member.name}`}
                                  aria-label={`Remover membro ${member.name}`}
                                  role="button"
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

                {/* Modern Pagination controls container */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 mt-4 border-t border-slate-100 select-none">
                  {/* Page size helper */}
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

                  {/* Page selector chevrons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                      aria-label="Página anterior"
                      role="button"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Numerical buttons */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                      aria-label="Próxima página"
                      role="button"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}
          {renderLegacyUsersBlock && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
              
              {/* Card Header with alignment identical to user design template */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Contas e Membros Ativos</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure quem possui acesso de visualização ou administração técnica.
                  </p>
                </div>
                
                {/* Search input + Add New User button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="pl-9 pr-4 py-1.5 w-full sm:w-[220px] text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#A60069] rounded-xl outline-none transition-all placeholder:text-slate-400 font-medium"
                      placeholder="Pesquisar usuários..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <button
                    onClick={handleOpenAddModal}
                    className="bg-[#A60069] text-white hover:bg-[#850053] transition-colors rounded-xl px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 duration-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Usuário</span>
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Membro</th>
                      <th className="pb-3 font-semibold md:table-cell">Cargo / Função</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                      <th className="pb-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/60">
                    {filteredMembers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-slate-400 font-medium">
                          Nenhum usuário encontrado correspondente à pesquisa.
                        </td>
                      </tr>
                    ) : (
                      filteredMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-55/30 transition-colors group">
                          {/* Member column (Avatar name and email) */}
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              {member.isPhoto && member.photoUrl ? (
                                <img
                                  src={member.photoUrl}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-100"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className={`w-10 h-10 rounded-full ${member.avatarBgColor} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
                                  {member.initials}
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                                  {member.name}
                                </span>
                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  {member.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Cargo Badge */}
                          <td className="py-4 md:table-cell">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                              <span>{member.role}</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-4 text-center">
                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{member.status}</span>
                            </div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditModal(member)}
                                className="p-2 text-slate-500 hover:text-[#A60069] bg-slate-50 hover:bg-[#A60069]/5 rounded-full border border-slate-100 transition-all"
                                title="Editar membro"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-full border border-slate-100 transition-all"
                                title="Remover membro"
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
            </div>
          )}

          {/* Active Tab: Meu Perfil Pessoal */}
          {activeTab === "perfil" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="border-b border-slate-100 pb-5 mb-6">
                <h2 className="text-base font-bold text-slate-800">Meu Perfil Pessoal</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gerencie suas informações de acesso e dados cadastrais no portal.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={async (e) => {
                e.preventDefault();

                try {
                  let photoUrl = profilePhotoPreview || undefined;
                  if (profile?.uid && profilePhotoFile) {
                    photoUrl = await uploadUserProfilePhoto(profile.uid, profilePhotoFile);
                  }

                  if (profile?.uid) {
                    await saveUserProfile({
                      uid: profile.uid,
                      email: profileEmail,
                      name: profileName,
                      role: profile.role,
                      phone: profilePhone,
                      photoUrl,
                      updatedAt: new Date().toISOString(),
                    });
                  }

                  setProfilePhotoPreview(photoUrl || null);
                  setProfilePhotoFile(null);
                  setIsProfileSaved(true);
                  setTimeout(() => setIsProfileSaved(false), 3000);
                } catch (error) {
                  showToast("Não foi possível salvar o perfil agora.", "error");
                }
              }} className="space-y-4">
                
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                  <div className="w-14 h-14 rounded-full bg-[#A60069] overflow-hidden flex items-center justify-center text-xl font-bold text-white shadow-md">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} alt="Foto do perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span>{profileName ? profileName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "AU"}</span>
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="font-bold text-slate-850 text-sm block">Foto do Perfil</span>
                    <span className="text-xs text-slate-400 font-medium">Envie uma imagem para salvar no Firebase Storage e sincronizar entre dispositivos.</span>
                  </div>
                  <label className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                    <Camera className="w-4 h-4 text-[#CD176D]" />
                    Alterar foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setProfilePhotoFile(file);
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nome Integrado
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Email Corporativo
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Telefone Celular
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Senha de backup
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800 pr-10"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#A60069] transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  {isProfileSaved ? (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Alterações salvas com sucesso!
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="bg-[#A60069] text-white hover:bg-[#850053] transition-colors rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Tab: Perfil da Cooperativa */}
          {activeTab === "cooperativa" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="border-b border-slate-100 pb-5 mb-6">
                <h2 className="text-base font-bold text-slate-800">Perfil da Cooperativa</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure e atualize dados institucionais oficiais da cooperativa parceira.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsCoopSaved(true);
                setTimeout(() => setIsCoopSaved(false), 3000);
              }} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Razão Social / Nome da Cooperativa
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                      value={coopName}
                      onChange={(e) => setCoopName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                      value={coopCNPJ}
                      onChange={(e) => setCoopCNPJ(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Sede Principal / Cidade
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                        value={coopAddress}
                        onChange={(e) => setCoopAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Telefone Institucional
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                        value={coopPhone}
                        onChange={(e) => setCoopPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Portal Web / Website
                    </label>
                    <div className="relative">
                      <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                        value={coopSite}
                        onChange={(e) => setCoopSite(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  {isCoopSaved ? (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Dados cadastrais salvos!
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="bg-[#A60069] text-white hover:bg-[#850053] transition-colors rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    Salvar Dados da Cooperativa
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Tab: Segurança & API */}
          {activeTab === "seguranca" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="border-b border-slate-100 pb-5 mb-6">
                <h2 className="text-base font-bold text-slate-800">Segurança & API</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gerencie chaves de segurança e controle de dados das origens de tráfego.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSecuritySaved(true);
                setTimeout(() => setIsSecuritySaved(false), 3000);
              }} className="space-y-4">
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Token / API Key do Webhook de Leads
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showApiKey ? "text" : "password"}
                      className="w-full pl-9 pr-14 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-mono text-slate-700 bg-slate-50/50"
                      value={apiKey}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#A60069] bg-pink/5 hover:bg-pink/15 px-2 py-1 rounded"
                    >
                      {showApiKey ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Use esta chave para autenticar requisições de Leads via API ou integradores de CRM.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    IPs Autorizados (Whitelist)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#A60069] font-semibold text-slate-800"
                    value={ipWhitelist}
                    onChange={(e) => setIpWhitelist(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Separe cada IP utilizando vírgulas. Deixe em branco se desejar aceitar requisições de qualquer IP.</p>
                </div>

                <div className="border border-slate-100 rounded-xl p-4 flex items-center justify-between bg-slate-50">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Exigir Autenticação em Duas Etapas (2FA)</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Obriga todos os membros do dashboard a autorizarem via mobile.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTwoFactor(!twoFactor)}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                      twoFactor ? "bg-[#A60069]" : "bg-slate-200"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute left-1 ${
                      twoFactor ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  {isSecuritySaved ? (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Chaves de API e IP atualizados!
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="bg-[#A60069] text-white hover:bg-[#850053] transition-colors rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    Salvar Tokens de Segurança
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Tab: Notificações & Alertas */}
          {activeTab === "alertas" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="border-b border-slate-100 pb-5 mb-6">
                <h2 className="text-base font-bold text-slate-800">Notificações & Alertas</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Parametrizar disparos em tempo real ou resumos analíticos por WhatsApp / Email.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                setIsAlertsSaved(true);
                setTimeout(() => setIsAlertsSaved(false), 3000);
              }} className="space-y-4">
                
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Configure os Gatilhos de Notificação</span>
                  
                  {/* Alert Toggle 1 */}
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-705 block">Desvios de orçamento no Meta ADS</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Avise via WhatsApp se o CPC estourar o limite definido para a semana.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlertMetaAdsMin(!alertMetaAdsMin)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                        alertMetaAdsMin ? "bg-[#A60069]" : "bg-slate-200"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute left-1 ${
                        alertMetaAdsMin ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Alert Toggle 2 */}
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-705 block">Quedas repentinas nas conversões diárias</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Gera alarme se houver 0 leads/pistas cadastradas entre 8h e 18h de dias úteis.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlertDropInDailyLeads(!alertDropInDailyLeads)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                        alertDropInDailyLeads ? "bg-[#A60069]" : "bg-slate-200"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute left-1 ${
                        alertDropInDailyLeads ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Alert Toggle 3 */}
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-705 block">Resumo de Performance em Email Semanal</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Envia um resumo completo do ROI de mídia de todas as cooperativas parceiras às sextas às 17h.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlertEmailDailySummary(!alertEmailDailySummary)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                        alertEmailDailySummary ? "bg-[#A60069]" : "bg-slate-200"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute left-1 ${
                        alertEmailDailySummary ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Alert Toggle 4 */}
                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-705 block">Disparar Alertas Críticos no WhatsApp da Diretoria</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Gatilhos automáticos em números cadastrados para desvios do NPS nacional.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAlertWhatsAppCritical(!alertWhatsAppCritical)}
                      className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                        alertWhatsAppCritical ? "bg-[#A60069]" : "bg-slate-200"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute left-1 ${
                        alertWhatsAppCritical ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                  {isAlertsSaved ? (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Regras de notificação configuradas com sucesso!
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="bg-[#A60069] text-white hover:bg-[#850053] transition-colors rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    Salvar Parâmetros de Disparo
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Interactive Modal for Adding / Editing Users with gorgeous matching inputs */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col scale-100 animate-[fadeIn_0.2s_ease-out] scrollbar-thin select-none">
            
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#CD176D]">
                  <User className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h2 className="text-lg font-black text-[#0F172A] tracking-tight">
                  {editingMember ? "Editar Usuário" : "Convidar Novo Usuário"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo section */}
            <div className="flex flex-col items-center py-4 shrink-0 bg-slate-50/40 border-b border-slate-100 mb-4">
              <div className="relative group">
                {formPhoto ? (
                  <img
                    src={formPhoto}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#A60069] text-white flex items-center justify-center font-black text-2xl border-4 border-white shadow-md">
                    {formName ? getInitials(formName) : "UN"}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#CD176D] hover:bg-[#A60069] border-2 border-white flex items-center justify-center text-white cursor-pointer shadow-md transition-all active:scale-90">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormPhotoFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormPhoto(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setFormPhotoFile(null);
                        setFormPhoto(null);
                      }
                    }}
                  />
                </label>
              </div>
              <span className="text-[9px] font-black tracking-widest text-[#64748B] mt-2 uppercase">FOTO DE PERFIL</span>
              <button
                type="button"
                onClick={() => {
                  setFormPhoto(null);
                  setFormPhotoFile(null);
                }}
                className="text-[10px] font-black text-[#CD176D] hover:text-[#A60069] mt-1 transition-colors uppercase tracking-wider cursor-pointer"
              >
                REMOVER FOTO
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveMember} className="px-6 pb-6 space-y-4">
              {/* 1. NOME COMPLETO */}
              <div>
                <label className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-xs font-semibold text-slate-800 border border-slate-200 focus:border-[#CD176D] focus:ring-2 focus:ring-[#CD176D]/10 rounded-2xl outline-none transition-all placeholder:text-slate-400"
                  placeholder="Ex: Dr. Elcio Beraldo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* 2. E-MAIL CORPORATIVO */}
              <div>
                <label className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 text-xs font-semibold text-slate-800 border border-slate-200 focus:border-[#CD176D] focus:ring-2 focus:ring-[#CD176D]/10 rounded-2xl outline-none transition-all placeholder:text-slate-400"
                  placeholder="Ex: drelcio@uniodonto.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              {/* 3. CARGO / FUNÇÃO (TOP SELECTOR) */}
              <div>
                <label className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Cargo / Função
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 text-xs font-extrabold text-slate-800 border border-slate-200 focus:border-[#CD176D] focus:ring-2 focus:ring-[#CD176D]/10 rounded-2xl outline-none transition-all bg-white appearance-none cursor-pointer pr-10"
                    value={formRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setFormRole(newRole);
                      // automatically adjust screens access
                      setFormScreens({
                        dashboard: true,
                        relatorios: true,
                        envio: newRole !== "Diretor" && newRole !== "Tech FerTaise",
                        configuracoes: newRole === "Tech FerTaise" || newRole === "Diretor"
                      });
                    }}
                  >
                    <option value="Diretor">Diretor</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Tech FerTaise">Tech FerTaise</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* 4. USUÁRIO */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                    Usuário
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormUsername(formEmail);
                    }}
                    className="text-[9px] font-black text-[#CD176D] hover:text-[#A60069] uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Usar E-mail
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full px-4 py-3 text-xs font-semibold text-slate-800 border border-slate-200 focus:border-[#CD176D] focus:ring-2 focus:ring-[#CD176D]/10 rounded-2xl outline-none transition-all placeholder:text-slate-400"
                  placeholder="Ex: drelcio"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
              </div>

              {/* 5. SENHA */}
              <div>
                <label className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showFormPassword ? "text" : "password"}
                    className="w-full pl-4 pr-11 py-3 text-xs font-semibold text-slate-800 border border-slate-200 focus:border-[#CD176D] focus:ring-2 focus:ring-[#CD176D]/10 rounded-2xl outline-none transition-all placeholder:text-slate-400"
                    placeholder="Deixe em branco para manter a senha atual"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#CD176D] transition-colors cursor-pointer p-0.5"
                  >
                    {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 6. STATUS DA CONTA */}
              <div>
                <label className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-2">
                  Status da Conta
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormStatus("ATIVO")}
                    className={`flex-1 py-2.5 rounded-2xl font-extrabold text-xs tracking-wide transition-all border text-center cursor-pointer ${
                      formStatus === "ATIVO"
                        ? "bg-[#E6FBF3] text-[#10B981] border-[#10B981]/30 shadow-sm"
                        : "bg-[#F8FAFC] text-slate-400 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    ATIVO
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormStatus("INATIVO")}
                    className={`flex-1 py-2.5 rounded-2xl font-extrabold text-xs tracking-wide transition-all border text-center cursor-pointer ${
                      formStatus === "INATIVO"
                        ? "bg-slate-100 text-slate-500 border-slate-300 shadow-sm"
                        : "bg-[#F8FAFC] text-slate-400 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    INATIVO
                  </button>
                </div>
              </div>

              {/* 7. TELAS DISPONÍVEIS */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                    Telas Disponíveis
                  </label>
                  {(formRole === "Diretor" || formRole === "Tech FerTaise") && (
                    <span className="text-[9px] font-black text-[#CD176D] bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                      Sem acesso a envio
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Dashboard Option */}
                  <div
                    onClick={() => setFormScreens({ ...formScreens, dashboard: !formScreens.dashboard })}
                    className={`border rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all h-20 relative select-none ${
                      formScreens.dashboard 
                        ? "bg-[#FDF2F8]/40 border-[#CD176D]" 
                        : "bg-[#F8FAFC]/50 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Dashboard</span>
                      <input
                        type="checkbox"
                        checked={formScreens.dashboard}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-[#CD176D] focus:ring-[#CD176D] h-3.5 w-3.5 cursor-pointer accent-[#CD176D]"
                      />
                    </div>
                    <span className="text-[9px] text-[#64748B] font-semibold">Visão geral do painel</span>
                  </div>

                  {/* Relatórios Option */}
                  <div
                    onClick={() => setFormScreens({ ...formScreens, relatorios: !formScreens.relatorios })}
                    className={`border rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all h-20 relative select-none ${
                      formScreens.relatorios 
                        ? "bg-[#FDF2F8]/40 border-[#CD176D]" 
                        : "bg-[#F8FAFC]/50 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Relatórios</span>
                      <input
                        type="checkbox"
                        checked={formScreens.relatorios}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-[#CD176D] focus:ring-[#CD176D] h-3.5 w-3.5 cursor-pointer accent-[#CD176D]"
                      />
                    </div>
                    <span className="text-[9px] text-[#64748B] font-semibold">Acesso aos relatórios</span>
                  </div>

                  {/* Envio Option */}
                  <div
                    onClick={() => {
                      if (formRole === "Diretor" || formRole === "Tech FerTaise") return;
                      setFormScreens({ ...formScreens, envio: !formScreens.envio });
                    }}
                    className={`border rounded-2xl p-3 flex flex-col justify-between transition-all h-20 relative select-none ${
                      formRole === "Diretor" || formRole === "Tech FerTaise"
                        ? "bg-[#F8FAFC]/30 border-slate-100 opacity-65 cursor-not-allowed"
                        : formScreens.envio 
                          ? "bg-[#FDF2F8]/40 border-[#CD176D] cursor-pointer" 
                          : "bg-[#F8FAFC]/50 border-slate-100 hover:border-slate-200 cursor-pointer"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Envio</span>
                      <input
                        type="checkbox"
                        disabled={formRole === "Diretor" || formRole === "Tech FerTaise"}
                        checked={formScreens.envio}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-[#CD176D] focus:ring-[#CD176D] h-3.5 w-3.5 disabled:opacity-50 accent-[#CD176D]"
                      />
                    </div>
                    <div className="flex flex-col mt-0.5">
                      <span className="text-[9px] text-[#64748B] font-semibold leading-none">Tela de envio de dados</span>
                      {(formRole === "Diretor" || formRole === "Tech FerTaise") && (
                        <span className="text-[8px] text-[#CD176D] font-extrabold tracking-tight mt-1 leading-none shrink-0">
                          Diretores não acessam a tela Envio
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Configurações Option */}
                  <div
                    onClick={() => setFormScreens({ ...formScreens, configuracoes: !formScreens.configuracoes })}
                    className={`border rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all h-20 relative select-none ${
                      formScreens.configuracoes 
                        ? "bg-[#FDF2F8]/40 border-[#CD176D]" 
                        : "bg-[#F8FAFC]/50 border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Configurações</span>
                      <input
                        type="checkbox"
                        checked={formScreens.configuracoes}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-[#CD176D] focus:ring-[#CD176D] h-3.5 w-3.5 cursor-pointer accent-[#CD176D]"
                      />
                    </div>
                    <span className="text-[9px] text-[#64748B] font-semibold">Perfil e ajustes</span>
                  </div>
                </div>
              </div>

              {/* 8. CARGO / FUNÇÃO (DUPLICATED SELECTOR AS REPLICATED IN USER SCREENSHOT) */}
              <div className="pt-2">
                <label className="block text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider mb-1.5">
                  Cargo / Função
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 text-xs font-semibold text-slate-800 border border-slate-200 focus:border-[#CD176D] focus:ring-2 focus:ring-[#CD176D]/10 rounded-2xl outline-none transition-all bg-white appearance-none cursor-pointer pr-10"
                    value={formRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setFormRole(newRole);
                      setFormScreens({
                        dashboard: true,
                        relatorios: true,
                        envio: newRole !== "Diretor" && newRole !== "Tech FerTaise",
                        configuracoes: newRole === "Tech FerTaise" || newRole === "Diretor"
                      });
                    }}
                  >
                    <option value="Diretor">Diretor</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Tech FerTaise">Tech FerTaise</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Modal Footer actions */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 bg-[#F8FAFC] border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold text-xs py-4.5 rounded-2xl transition-all tracking-wider cursor-pointer text-center"
                >
                  CANCELAR
                </button>
                
                <button
                  type="submit"
                  className="w-1/2 bg-[#CD176D] hover:bg-[#A60069] text-white font-black text-xs py-4.5 rounded-2xl transition-all tracking-wider cursor-pointer shadow-md text-center uppercase"
                >
                  SALVAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Deletion Confirmation Modal */}
      {memberIdToDelete !== null && (() => {
        const memberToDelete = members.find(m => m.id === memberIdToDelete);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden select-none animate-[fadeIn_0.15s_ease-out]">
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <AlertTriangle className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-sm font-black text-slate-900 mb-1.5 uppercase tracking-wide">
                  Confirmar Remoção
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Tem certeza que deseja remover o usuário <span className="font-bold text-slate-900">"{memberToDelete?.name}"</span>? Esta ação não poderá ser desfeita.
                </p>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex items-center gap-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setMemberIdToDelete(null)}
                  className="w-1/2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-sm text-center uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (memberIdToDelete) handleDeleteMemberAction(memberIdToDelete);
                  }}
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md text-center uppercase"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Success/Error Alert Toast */}
      {toast !== null && (
        <div className="fixed bottom-6 right-6 z-55 max-w-md animate-[slideUp_0.25s_ease-out] select-none">
          <div className={`p-4 rounded-2xl border shadow-xl flex items-center gap-3 ${
            toast.type === "success" 
              ? "bg-[#E6FBF3] border-emerald-200 text-emerald-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === "success" ? "bg-emerald-500/10" : "bg-red-55/10"
            }`}>
              {toast.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              ) : (
                <X className="w-4 h-4 text-red-600 stroke-[3]" />
              )}
            </div>
            <div className="flex-1">
              <span className="block text-xs font-black uppercase tracking-wider">
                {toast.type === "success" ? "Sucesso" : "Aviso / Erro"}
              </span>
              <span className="block text-xs font-semibold text-slate-700 mt-0.5">
                {toast.message}
              </span>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
