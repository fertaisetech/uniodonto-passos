import { useState, useEffect } from "react";
import {
  Outlet,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router";
import { Sidebar, BottomNav } from "./Navigation";
import {
  Menu,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Filter,
  Download,
  FileText,
  Sparkles,
  Plus,
  LogOut,
} from "lucide-react";
import { useAppSession } from "../context/AppSessionContext";
import { getCurrentMonthKey, getPeriodLabel } from "../lib/dashboardData";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isCommunications =
    location.pathname === "/comunicacoes" ||
    location.pathname === "/comunicacao";
  const [isGeneratingRelatorios, setIsGeneratingRelatorios] = useState(false);
  const { profile, signOut } = useAppSession();

  const reportType = searchParams.get("type") || "consolidado";

  useEffect(() => {
    const startHandler = () => setIsGeneratingRelatorios(true);
    const endHandler = () => setIsGeneratingRelatorios(false);

    window.addEventListener("relatorios-gen-start", startHandler);
    window.addEventListener("relatorios-gen-end", endHandler);
    return () => {
      window.removeEventListener("relatorios-gen-start", startHandler);
      window.removeEventListener("relatorios-gen-end", endHandler);
    };
  }, []);

  const isDashboard = location.pathname === "/dashboard";
  const isEnvio = location.pathname === "/envio-integracao";
  const isVisaoGeral = location.pathname === "/";
  const currentTab = searchParams.get("tab") || "Geral";

  const monthsList = [
    "Janeiro/2026",
    "Fevereiro/2026",
    "Março/2026",
    "Abril/2026",
    "Maio/2026",
    "Junho/2026",
    "Julho/2026",
    "Agosto/2026",
    "Setembro/2026",
    "Outubro/2026",
    "Novembro/2026",
    "Dezembro/2026",
  ];
  const currentSystemMonth = getCurrentMonthKey();
  const currentSystemMonthIndex = monthsList.indexOf(currentSystemMonth);
  const reportMonths =
    currentSystemMonthIndex >= 0
      ? monthsList.slice(0, currentSystemMonthIndex + 1).reverse()
      : monthsList.slice().reverse();

  const requestedMonth = searchParams.get("month");
  const currentMonth = requestedMonth || currentSystemMonth;
  const isMonthActive = currentMonth !== "Todos";
  const refMonth = currentMonth !== "Todos" ? currentMonth : "";
  const refIndex =
    monthsList.indexOf(refMonth) !== -1 ? monthsList.indexOf(refMonth) : 0;

  const prevMonth = refIndex > 0 ? monthsList[refIndex - 1] : null;
  const currentMonthDisplay = getPeriodLabel(
    currentMonth === "Todos" ? "Todos" : monthsList[refIndex],
  );
  const nextMonth =
    refIndex < monthsList.length - 1 ? monthsList[refIndex + 1] : null;

  const hasNextMonth = refIndex < monthsList.length - 1;

  const updateMonth = (month: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("month", month);
    setSearchParams(newParams);
  };

  return (
    <div className="flex h-screen bg-background text-text-primary antialiased overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col h-full min-w-0">
        <header
          className={`dashboard-header z-10 shrink-0 ${
            isDashboard ? "dashboard-header--dashboard" : ""
          }`}
        >
          <div className="dashboard-header__page">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary"
                aria-label="Abrir menu lateral"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex flex-col">
                {/* Breadcrumb section */}
                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mb-1.5 leading-none select-none">
                  <span
                    className="hover:text-[#CD176D] transition-colors cursor-pointer"
                    onClick={() => navigate("/")}
                  >
                    Início
                  </span>
                  <span className="text-slate-400 font-medium font-mono text-[9px]">
                    &gt;
                  </span>
                  {isDashboard ? (
                    <>
                      <span
                        className="hover:text-[#CD176D] transition-colors cursor-pointer"
                        onClick={() => navigate("/dashboard")}
                      >
                        Resumos
                      </span>
                      <span className="text-slate-400 font-medium font-mono text-[9px]">
                        &gt;
                      </span>
                      <span className="text-[#CD176D]">Métricas do Funil</span>
                    </>
                  ) : location.pathname === "/configuracoes" ? (
                    <>
                      <span
                        className="hover:text-[#CD176D] transition-colors cursor-pointer"
                        onClick={() => navigate("/configuracoes")}
                      >
                        Configurações
                      </span>
                      <span className="text-slate-400 font-medium font-mono text-[9px]">
                        &gt;
                      </span>
                      <span className="text-[#CD176D]">
                        Gerenciamento de Usuários
                      </span>
                    </>
                  ) : location.pathname === "/relatorios" ? (
                    <>
                      <span
                        className="hover:text-[#CD176D] transition-colors cursor-pointer"
                        onClick={() => navigate("/relatorios")}
                      >
                        Relatórios
                      </span>
                      <span className="text-slate-400 font-medium font-mono text-[9px]">
                        &gt;
                      </span>
                      <span className="text-[#CD176D]">
                        Relatórios Executivos
                      </span>
                    </>
                  ) : isCommunications ? (
                    <>
                      <span
                        className="hover:text-[#CD176D] transition-colors cursor-pointer"
                        onClick={() => navigate("/comunicacoes")}
                      >
                        Relacionamento
                      </span>
                      <span className="text-slate-400 font-medium font-mono text-[9px]">
                        &gt;
                      </span>
                      <span className="text-[#CD176D]">Comunicações</span>
                    </>
                  ) : location.pathname === "/envio-integracao" ? (
                    <>
                      <span
                        className="hover:text-[#CD176D] transition-colors cursor-pointer"
                        onClick={() => navigate("/envio-integracao")}
                      >
                        Integração
                      </span>
                      <span className="text-slate-400 font-medium font-mono text-[9px]">
                        &gt;
                      </span>
                      <span className="text-[#CD176D]">Envio e Integração</span>
                    </>
                  ) : (
                    <span className="text-[#CD176D]">Visão Geral</span>
                  )}
                </div>
                <h1>
                  {isDashboard
                    ? (
                        <>
                          <span className="md:hidden">Dashboard UniOdonto</span>
                          <span className="hidden md:inline">Métricas do Funil</span>
                        </>
                      )
                    : location.pathname === "/configuracoes"
                      ? "Configurações"
                      : location.pathname === "/relatorios"
                        ? "Relatórios Executivos"
                        : isCommunications
                          ? "Comunicações"
                          : location.pathname === "/envio-integracao"
                            ? "Envio e Integração"
                            : "Visão Geral"}
                </h1>
                <p className={isDashboard ? "hidden md:block" : undefined}>
                  {isDashboard
                    ? "Visualização detalhada de canais e campanhas da Uniodonto."
                    : location.pathname === "/configuracoes"
                      ? "Gerenciamento do sistema e preferências."
                      : location.pathname === "/relatorios"
                        ? "Relatório integrado conectando a Visão Geral com as Métricas do Funil."
                        : isCommunications
                          ? "Envie mensagens, avisos e comunicados aos beneficiários de forma prática e segura."
                          : location.pathname === "/envio-integracao"
                            ? "Painel de entrada de dados e parametrização do dashboard."
                            : "Acompanhamento dos principais indicadores da Uniodonto."}
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-header__actions">
            {isCommunications ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-sm">
                  {[
                    ["Enviar mensagem", "enviar"],
                    ["Avisos e lembretes", "avisos"],
                    ["Templates", "templates"],
                    ["Histórico de envios", "historico"],
                  ].map(([label, value]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => navigate(`/comunicacoes?tab=${value}`)}
                      className="rounded-lg px-3 py-2 text-[10px] font-black text-slate-600 hover:bg-[#FFF5F9] hover:text-[#A60069]"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/comunicacoes?tab=enviar")}
                  className="flex items-center gap-2 rounded-xl bg-[#CD176D] px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#A60069]"
                >
                  <Plus className="h-4 w-4" /> Nova comunicação
                </button>
              </div>
            ) : isDashboard ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 md:gap-3 w-full sm:w-auto">
                <div className="relative w-[148px] shrink-0 self-center md:hidden">
                  <select
                    value={currentMonth}
                    onChange={(event) => updateMonth(event.target.value)}
                    className="!flex-none !h-10 !w-[148px] appearance-none rounded-xl border-2 border-[#CD176D] bg-[#FFF8FB] px-3 pr-9 text-xs font-extrabold text-[#A60069] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#CD176D]/20"
                    aria-label={`Selecionar mês atual ${currentMonthDisplay}`}
                  >
                    <option value="Todos">Todos os Meses</option>
                    {monthsList.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#CD176D]"
                  />
                </div>

                <div className="hidden md:flex flex-col sm:flex-row items-center gap-3">
                  {/* 1. Monthly navigation row */}
                  <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 shadow-sm select-none">
                    {refIndex > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextIdx = refIndex - 1;
                          updateMonth(monthsList[nextIdx]);
                        }}
                        className="p-1 text-[#64748B] hover:text-[#A60069] hover:bg-[#FFF5F9] rounded-md transition-all self-center"
                        title="Mês Anterior"
                        aria-label="Ir para o mês anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}

                    {prevMonth && (
                      <button
                        type="button"
                        onClick={() => updateMonth(prevMonth)}
                        className="px-3 py-1 text-xs font-semibold text-[#64748B] hover:text-[#A60069] hover:bg-[#FFF5F9] rounded-lg transition-all"
                        aria-label={`Selecionar mês ${prevMonth}`}
                      >
                        {prevMonth}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => updateMonth(currentMonthDisplay)}
                      className={`px-4 py-1 text-xs font-extrabold rounded-lg transition-all border ${
                        isMonthActive
                          ? "bg-[#FFF5F9] text-[#A60069] border-[#A60069]/20 shadow-[0_1px_2px_rgba(166,0,105,0.08)]"
                          : "bg-white border-transparent text-[#64748B] hover:text-[#A60069] hover:bg-[#FFF5F9]"
                      }`}
                      aria-label={`Selecionar mês atual ${currentMonthDisplay}`}
                    >
                      {currentMonthDisplay}
                    </button>

                    {nextMonth && (
                      <button
                        type="button"
                        onClick={() => updateMonth(nextMonth)}
                        className="px-3 py-1 text-xs font-semibold text-[#64748B] hover:text-[#A60069] hover:bg-[#FFF5F9] rounded-lg transition-all"
                        aria-label={`Selecionar mês ${nextMonth}`}
                      >
                        {nextMonth}
                      </button>
                    )}

                    {hasNextMonth && (
                      <button
                        type="button"
                        onClick={() => updateMonth(monthsList[refIndex + 1])}
                        className="p-1 text-[#64748B] hover:text-[#A60069] hover:bg-[#FFF5F9] rounded-md transition-all self-center"
                        title="Próximo Mês"
                        aria-label="Ir para o próximo mês"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 2. Select box for all months */}
                  <select
                    value={currentMonth}
                    onChange={(e) => {
                      updateMonth(e.target.value);
                    }}
                    className="border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs bg-white font-bold text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-[#A60069]/20 cursor-pointer h-[34px] shadow-sm transition-all"
                    aria-label="Selecionar mês"
                  >
                    <option value="Todos">Todos os Meses</option>
                    {monthsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : location.pathname === "/relatorios" ? (
              <div className="no-print flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl h-[34px] shadow-sm bg-white">
                  <Calendar className="w-3.5 h-3.5 text-[#A60069]" />
                  <select
                    value={currentMonth}
                    onChange={(e) => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set("month", e.target.value);
                      setSearchParams(newParams);
                    }}
                    className="bg-transparent border-none text-[11px] font-extrabold focus:outline-none text-slate-700 cursor-pointer"
                    aria-label="Selecionar mês do relatório"
                  >
                    {reportMonths.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl h-[34px] shadow-sm bg-white">
                  <Filter className="w-3.5 h-3.5 text-[#A60069]" />
                  <select
                    value={reportType}
                    onChange={(e) => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set("type", e.target.value);
                      setSearchParams(newParams);
                    }}
                    className="bg-transparent border-none text-[11px] font-extrabold focus:outline-none text-slate-700 cursor-pointer"
                    aria-label="Selecionar tipo de relatório"
                  >
                    <option value="consolidado">Foco: Consolidado Geral</option>
                    <option value="funil">Foco: Funil Comercial</option>
                    <option value="crescimento">Foco: Crescimento & NPS</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof (window as any).triggerRelatorioDownloadCSV ===
                      "function"
                    ) {
                      (window as any).triggerRelatorioDownloadCSV();
                    } else {
                      window.dispatchEvent(
                        new CustomEvent("relatorios-download-csv"),
                      );
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 h-[34px] rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-slate-700 text-[11px] font-black transition-all cursor-pointer shadow-sm bg-white"
                  title="Baixar Planilha"
                  aria-label="Baixar planilha de relatório"
                >
                  <Download className="w-3.5 h-3.5" />
                  BAIXAR PLANILHA
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof (window as any).triggerRelatorioExportPDF ===
                      "function"
                    ) {
                      (window as any).triggerRelatorioExportPDF();
                    } else {
                      window.print();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 h-[34px] rounded-xl border border-[#CD176D]/20 hover:bg-pink-50/20 text-[#CD176D] text-[11px] font-black transition-all cursor-pointer shadow-sm bg-white"
                  title="Exportar PDF/Imprimir"
                  aria-label="Exportar relatório em PDF ou imprimir"
                >
                  <FileText className="w-3.5 h-3.5" />
                  EXPORTAR PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof (window as any).triggerRelatorioGenerateNew ===
                      "function"
                    ) {
                      (window as any).triggerRelatorioGenerateNew();
                    } else {
                      window.dispatchEvent(
                        new CustomEvent("relatorios-generate-new"),
                      );
                    }
                  }}
                  disabled={isGeneratingRelatorios}
                  className="flex items-center gap-1.5 bg-[#CD176D] hover:bg-[#A60069] disabled:bg-slate-300 text-white px-4 py-1.5 h-[34px] rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-md shadow-pink-100"
                  aria-label="Gerar novo relatório"
                >
                  {isGeneratingRelatorios ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      COMPILANDO...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      GERAR NOVO RELATÓRIO
                    </>
                  )}
                </button>
              </div>
            ) : location.pathname === "/configuracoes" ? null : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 1. Month Dropdown with Icon */}
                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-xl h-[34px] shadow-sm bg-white">
                  <Calendar className="w-3.5 h-3.5 text-[#A60069]" />
                  <select
                    value={currentMonth}
                    onChange={(e) => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set("month", e.target.value);
                      setSearchParams(newParams);
                    }}
                    className="bg-transparent border-none text-[11px] font-extrabold focus:outline-none text-slate-700 cursor-pointer"
                  >
                    <option value="Todos">Todos os Meses</option>
                    {monthsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Month Chevron Switchers */}
                <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm select-none h-[34px]">
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx =
                        refIndex > 0 ? refIndex - 1 : monthsList.length - 1;
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set("month", monthsList[nextIdx]);
                      setSearchParams(newParams);
                    }}
                    className="p-1 text-[#64748B] hover:text-[#A60069] hover:bg-[#FFF5F9] rounded-md transition-all self-center h-6 w-6 flex items-center justify-center cursor-pointer"
                    title="Mês Anterior"
                    aria-label="Ir para o mês anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-extrabold text-slate-700 px-1 select-none min-w-[70px] text-center">
                    {currentMonthDisplay}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx =
                        refIndex < monthsList.length - 1 ? refIndex + 1 : 0;
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set("month", monthsList[nextIdx]);
                      setSearchParams(newParams);
                    }}
                    className="p-1 text-[#64748B] hover:text-[#A60069] hover:bg-[#FFF5F9] rounded-md transition-all self-center h-6 w-6 flex items-center justify-center cursor-pointer"
                    title="Próximo Mês"
                    aria-label="Ir para o próximo mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 3. Action Navigate Button */}
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("save-monthly-dashboard"),
                    )
                  }
                  className="flex items-center gap-1.5 bg-[#CD176D] hover:bg-[#A60069] text-white px-4 py-1.5 h-[34px] rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-md shadow-pink-100 animate-[fadeIn_0.15s_ease-out]"
                  aria-label="Salvar os dados do mês"
                >
                  <Download className="w-3.5 h-3.5" />
                  SALVAR OS DADOS DO MÊS
                </button>
              </div>
            )}
          </div>

          <div className="dashboard-header__profile">
            <button
              className="p-2 text-text-secondary hover:bg-gray-100 rounded-full transition-colors relative mr-2"
              type="button"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-4 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-[#CD176D]/10 text-[#CD176D] flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left text-sm">
                <p className="font-semibold text-text-primary leading-none">
                  {profile ? profile.name : "Diretoria"}
                </p>
                <p className="text-text-secondary text-[10px] mt-1 font-semibold leading-none">
                  {profile ? profile.role : "Admin"}
                </p>
              </div>

              {/* Quick Logout header toggle */}
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm("Deseja realmente sair do sistema?")) {
                    await signOut();
                    window.location.reload();
                  }
                }}
                className="p-1.5 ml-2 hover:bg-rose-50 text-slate-400 hover:text-[#CD176D] rounded-xl transition-all cursor-pointer"
                title="Sair do painel"
                aria-label="Sair do painel"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        <main
          className={`flex-1 w-full ${isDashboard || isEnvio ? "h-auto lg:h-[calc(100vh-4rem)] overflow-y-auto lg:overflow-hidden pb-16 lg:pb-0" : "overflow-y-auto pb-16 md:pb-0"}`}
        >
          <div
            className={`${isDashboard || isEnvio ? "p-3 h-auto lg:h-full flex flex-col" : isVisaoGeral ? "p-3 sm:p-4 lg:p-[18px] min-h-full" : "p-4 sm:p-6 lg:p-8 min-h-full"} max-w-[1700px] mx-auto w-full`}
          >
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
