import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  BarChart,
  Send,
  MessageSquare,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Download,
  Smartphone,
  Laptop,
  Info,
  ExternalLink,
  ShoppingCart,
} from "lucide-react";
import clsx from "clsx";
import { useAppSession } from "../context/AppSessionContext";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { canAccessScreen, type ScreenKey } from "../lib/screenAccess";
import { CRM_URL, SALES_APP_URL } from "../config/apps";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Visão Geral", href: "/", icon: PieChart },
  { name: "Relatórios", href: "/relatorios", icon: BarChart },
  { name: "Envio e Integração", href: "/envio-integracao", icon: Send, hasChevron: true },
  { name: "Comunicações", href: "/comunicacoes", icon: MessageSquare },
  { name: "App de Vendas", href: "/app-vendas", icon: ShoppingCart, externalHref: SALES_APP_URL },
  { name: "CRM", href: "/crm", icon: Users, externalHref: CRM_URL },
];

export function Sidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const location = useLocation();
  const { installable, installApp } = usePWAInstall();
  const { profile, signOut } = useAppSession();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowHelpModal(false);
        setShowInstallModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleCollapsed = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    localStorage.setItem("sidebar-collapsed", String(nextState));
  };

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair do sistema?")) {
      try {
        await signOut();
        window.location.reload();
      } catch (error) {
        window.location.reload();
      }
    }
  };

  return (
    <>
      <div className={clsx(
        "no-print fixed inset-y-0 left-0 z-50 bg-[#A60069] text-white transform transition-all duration-300 ease-in-out md:translate-x-0 md:static flex flex-col overflow-hidden shrink-0 border-r border-white/5",
        collapsed ? "md:w-20" : "md:w-64",
        open ? "translate-x-0 w-64" : "-translate-x-full"
      )}>
        {/* Header styling */}
        <div className={clsx(
          "relative flex items-center h-16 shrink-0 border-b border-white/10",
          collapsed ? "justify-center px-2" : "justify-between px-4"
        )}>
          <div className={clsx("flex items-center gap-3 overflow-hidden", collapsed && "justify-center") }>
            <div className="w-9 h-9 rounded-xl shrink-0 bg-white flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src="/images/LogoUniodonto.webp"
                alt="Logo Uniodonto"
                className="w-full h-full object-cover"
                loading="eager"
                draggable={false}
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-[#ffffff] text-base leading-tight tracking-wide">Uniodonto</span>
                <span className="text-[9px] text-[#ffffff]/60 font-semibold tracking-wider uppercase">Portal Executivo</span>
              </div>
            )}
          </div>
          
          <button
            type="button"
            onClick={toggleCollapsed}
            className={clsx(
              "hidden md:flex p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 hover:text-white transition-all cursor-pointer",
              collapsed ? "absolute right-1 top-1 z-10" : ""
            )}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
          
          <button 
            type="button"
            onClick={() => setOpen(false)} 
            className="md:hidden p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.filter((item) => {
            const screenByPath: Record<string, ScreenKey> = { "/": "visaoGeral", "/dashboard": "dashboard", "/relatorios": "relatorios", "/envio-integracao": "envio", "/configuracoes": "configuracoes", "/comunicacoes": "comunicacoes", "/app-vendas": "appVendas", "/crm": "crm" };
            return canAccessScreen(profile?.role, screenByPath[item.href], profile?.screens);
          }).map((item) => {
            const isActive = location.pathname === item.href;
            const linkClass = clsx(
                "flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-white/20 text-white font-extrabold shadow-[0_2px_12px_rgba(255,255,255,0.06)] border border-white/15 pl-4 before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1 before:bg-white before:rounded-r-full"
                    : "text-white/80 hover:bg-white/10 hover:text-white font-semibold pl-3"
                );
            const content = <>
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="whitespace-nowrap overflow-hidden text-sm md:text-[15px] tracking-wide flex-1 mr-2 transition-all">{item.name}</span>}
              {!collapsed && item.hasChevron && <ChevronRight className="w-3.5 h-3.5 text-white/50 shrink-0 ml-auto" />}
            </>;
            return item.externalHref ? (
            <a
              key={item.name}
              href={item.externalHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.name}
              className={linkClass}
              title={item.name}
              onClick={() => setOpen(false)}
            >{content}</a>
            ) : (
            <Link
              key={item.name}
              to={item.href}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className={linkClass}
              title={item.name}
              onClick={() => setOpen(false)}
            >{content}</Link>
            );
          })}
        </nav>

        {/* Divider line before Profile section */}
        <div className="border-t border-white/10 my-1 mx-3"></div>

        {/* Bottom Profile section & Footer buttons */}
        <div className="p-3 space-y-2">
          {/* Profile Card inside translucent container */}
          <div className={clsx(
            "bg-white/10 border border-white/5 rounded-2xl flex items-center transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)]",
            collapsed ? "p-1.5 justify-center" : "p-3 gap-2.5"
          )}>
            <div className={clsx(
              "rounded-full bg-[#FF4B8B] text-white flex items-center justify-center font-extrabold border-2 border-white/20 shadow-md shrink-0 transition-all overflow-hidden",
              collapsed ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm"
            )}>
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt={`Foto de ${profile.name}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : profile ? (
                profile.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "OP"
              ) : "FT"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-white truncate leading-tight">
                  {profile ? profile.name : "FerTaise Tech Admin"}
                </p>
                <p className="text-white/70 text-[10px] mt-0.5 truncate font-semibold">
                  {profile ? profile.role : "Tech FerTaise"}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons (Configurações, Ajuda, Sair) */}
          <div className="space-y-0.5">
            <Link
              to="/configuracoes"
              className={clsx(
                "flex items-center gap-3 py-2 rounded-xl transition-all w-full text-left font-semibold cursor-pointer relative",
                location.pathname === "/configuracoes"
                  ? "bg-white/20 text-white font-extrabold border border-white/12 shadow-sm pl-4 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-white before:rounded-r-full"
                  : "text-white/80 hover:bg-white/10 hover:text-white pl-3"
              )}
              title="Configurações"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="text-sm md:text-[15px] tracking-wide">Configurações</span>}
            </Link>

            <button
              type="button"
              onClick={() => {
                setShowHelpModal(true);
                setOpen(false);
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all w-full text-left font-semibold text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
              title="Ajuda"
            >
              <HelpCircle className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="text-sm md:text-[15px] tracking-wide">Ajuda</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                if (installable) {
                  installApp();
                } else {
                  setShowInstallModal(true);
                }
                setOpen(false);
              }}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-xl transition-all w-full text-left font-semibold cursor-pointer",
                installable 
                  ? "bg-white/15 text-white border border-white/10 shadow-[0_2px_10px_rgba(255,255,255,0.05)] font-bold" 
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
              title="Instalar Aplicativo (PWA)"
              aria-label="Instalar aplicativo PWA"
            >
              <Download className={clsx("w-4.5 h-4.5 shrink-0", installable && "text-emerald-400 stroke-[2.5]")} />
              {!collapsed && (
                <span className="text-sm md:text-[15px] tracking-wide flex items-center gap-2">
                  Instalar App
                  {installable && (
                    <span className="bg-emerald-400 text-[#A60069] text-[8px] font-black px-1 py-0.5 rounded uppercase leading-none">PWA</span>
                  )}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all w-full text-left font-semibold text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
              title="Sair"
              aria-label="Sair do sistema"
            >
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="text-sm md:text-[15px] tracking-wide">Sair</span>}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Support / Help Modal ("Central de Suporte") */}
      {showHelpModal && (
        <div 
          onClick={() => setShowHelpModal(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-[fadeIn_0.2s_ease-out] relative cursor-default"
          >
            {/* Top right escape button */}
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              title="Fechar"
              aria-label="Fechar central de suporte"
            >
              <X className="w-5 h-5 focus:outline-none" />
            </button>

            {/* Top rounded icon matching image 2 */}
            <div className="w-16 h-16 bg-pink-100/50 rounded-2xl flex items-center justify-center mb-4 mt-2">
              <div className="w-10 h-10 border-2 border-[#A60069] rounded-full flex items-center justify-center text-[#A60069]">
                <HelpCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
            </div>

            {/* Support Information */}
            <h3 className="font-extrabold text-[#111827] text-2xl leading-none">Central de Suporte</h3>
            <p className="text-[#64748B] text-xs px-2 mt-4 mb-6 leading-relaxed">
              Precisa de auxílio com o dashboard ou com a integração de dados? Utilize nossos canais de atendimento:
            </p>

            {/* Inner Details Box matching screenshot */}
            <div className="bg-[#F8FAFC] rounded-2xl p-4 w-full text-left space-y-3.5 mb-6 border border-[#F1F5F9]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B] font-semibold">Suporte Técnico</span>
                <span className="text-[#0F172A] font-extrabold">FerTaise Tech</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B] font-semibold">Celular / WhatsApp</span>
                <span className="text-[#0F172A] font-extrabold">(12) 99756-9426</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B] font-semibold">E-mail</span>
                <span className="text-[#0F172A] font-extrabold select-all">fertaisetech@gmail.com</span>
              </div>
            </div>

            {/* Action close button */}
            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-[#CD176D] hover:bg-[#A60069] text-white font-black text-sm py-4 rounded-2xl shadow-md transition-all uppercase tracking-wider cursor-pointer font-sans"
              aria-label="Fechar central de suporte"
            >
              FECHAR SUPORTE
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Help Modal */}
      {showInstallModal && (
        <div 
          onClick={() => setShowInstallModal(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col animate-[fadeIn_0.2s_ease-out] relative cursor-default text-left"
          >
            {/* Top right escape button */}
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              title="Fechar"
              aria-label="Fechar instruções de instalação"
            >
              <X className="w-5 h-5 focus:outline-none" />
            </button>

            {/* Top Icon and Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-pink-100/50 rounded-2xl flex items-center justify-center text-[#CD176D] border border-pink-200 shrink-0">
                <Download className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#111827] text-lg leading-tight">Instalar Uniodonto BI</h3>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Transforme em aplicativo de celular ou desktop</span>
              </div>
            </div>

            {/* Main content body */}
            <p className="text-slate-600 text-xs leading-relaxed mb-4">
              Instale o painel em seu celular ou computador para desfrutar de inicialização instantânea, suporte offline e aproveitamento de 100% do espaço de tela (sem as barras do navegador).
            </p>

            {/* Ambient Info Box */}
            <div className="bg-[#FFFCE6] border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 mb-5 flex gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Visualização do AI Studio (Iframe)</p>
                <p className="leading-snug text-amber-800/90 text-[11px]">
                  Como este painel está rodando dentro de um iframe de visualização, o navegador restringe a instalação automática. Abra em uma aba dedicada para ver e acionar o botão de instalação nativo:
                </p>
                <a 
                  href="/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-black text-[#CD176D] hover:underline mt-1.5 cursor-pointer text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir em Nova Aba</span>
                </a>
              </div>
            </div>

            {/* Step instructions */}
            <div className="space-y-3 mb-6">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Instruções por dispositivo</p>
              
              <div className="flex gap-3 text-xs">
                <Laptop className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-800">Computador (Chrome, Edge, Opera)</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                    Procure pelo ícone <strong className="text-slate-700 font-bold">Instalar Uniodonto BI</strong> na barra de endereços (à direita) ou acesse o menu de opções do navegador (⋮ ou ···).
                  </p>
                </div>
              </div>

              <div className="flex gap-3 text-xs">
                <Smartphone className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-800">Smartphones (Android ou iOS Safari)</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">
                    No iPhone/iOS, clique em <strong className="text-slate-700 font-bold">Compartilhar ↑</strong> e selecione <strong className="text-slate-700 font-bold">Adicionar à Tela de Início</strong>. No Android, selecione (⋮) e depois <strong className="text-slate-700 font-bold">Instalar aplicativo</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full bg-[#CD176D] hover:bg-[#A60069] text-white font-black text-xs py-3.5 rounded-2xl shadow-sm transition-all uppercase tracking-wider cursor-pointer font-sans"
              aria-label="Fechar instruções de instalação"
            >
              FECHAR INSTRUÇÕES
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function BottomNav() {
  const location = useLocation();
  const { profile } = useAppSession();
  const mobileNav = [
    { name: "Visão Geral", href: "/", icon: PieChart },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Relatórios", href: "/relatorios", icon: BarChart },
    { name: "Envio", href: "/envio-integracao", icon: Send },
  ];

  return (
    <div className="no-print md:hidden fixed bottom-0 left-0 right-0 glass-card !border-x-0 !border-b-0 !rounded-none flex justify-around items-center h-16 z-40 pb-safe shadow-lg">
      {mobileNav.filter((item) => canAccessScreen(profile?.role, ({ "/": "visaoGeral", "/dashboard": "dashboard", "/relatorios": "relatorios", "/envio-integracao": "envio" } as Record<string, ScreenKey>)[item.href], profile?.screens)).map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            aria-label={item.name}
            aria-current={isActive ? "page" : undefined}
            className={clsx(
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
              isActive ? "text-[#A60069]" : "text-text-secondary"
            )}
          >
            <item.icon className={clsx("w-5 h-5", isActive ? "text-[#A60069]" : "text-opacity-70")} />
            <span className="text-[10px] font-bold tracking-wide">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
