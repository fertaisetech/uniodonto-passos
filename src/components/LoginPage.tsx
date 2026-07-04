import React, { useState } from "react";
import {
  User,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import { signInOrCreateWithPassword, toLoginEmail } from "../lib/firebase";
import { setAppSession } from "../context/AppSessionContext";

export function LoginPage() {
  const [emailOrUser, setEmailOrUser] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const performLogin = async (emailInput: string, passwordInput: string) => {
    setIsLoggingIn(true);
    setErrorMsg("");

    try {
      const user = await signInOrCreateWithPassword(emailInput, passwordInput);
      const { passwordHash: _passwordHash, ...publicProfile } = user as any;
      setAppSession(publicProfile);
      localStorage.setItem("uniodonto_lgpd_accepted_v1", "true");
      localStorage.setItem("uniodonto_last_login_email", publicProfile.email || toLoginEmail(emailInput));
      window.location.reload();
    } catch (error) {
      setErrorMsg("Não foi possível entrar. Verifique seu usuário e senha.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoClick = () => {
    const nextClicks = logoClicks + 1;
    setLogoClicks(nextClicks);
    if (nextClicks >= 3) {
      setLogoClicks(0);
      const email = "diretoria@uniodonto.com";
      const passwordValue = "admin123";

      if (localStorage.getItem("uniodonto_lgpd_accepted_v1") === "true") {
        void performLogin(email, passwordValue);
      } else {
        setPendingCredentials({ email, password: passwordValue });
        setShowConsentModal(true);
      }
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!emailOrUser.trim()) {
      setErrorMsg("Por favor, preencha o seu usuário ou e-mail.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("A senha de acesso deve conter pelo menos 6 caracteres.");
      return;
    }

    const email = toLoginEmail(emailOrUser);
    if (localStorage.getItem("uniodonto_lgpd_accepted_v1") === "true") {
      void performLogin(email, password);
      return;
    }

    setPendingCredentials({ email, password });
    setShowConsentModal(true);
  };

  const handleAcceptTerms = () => {
    localStorage.setItem("uniodonto_lgpd_accepted_v1", "true");
    setShowConsentModal(false);

    if (pendingCredentials) {
      void performLogin(pendingCredentials.email, pendingCredentials.password);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 relative p-4 overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle at 10% 20%, rgba(253, 244, 245, 0.9) 0%, rgba(248, 250, 252, 1) 90%)",
      }}
    >
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-pink-100/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-5%] w-[450px] h-[450px] rounded-full bg-pink-50/40 blur-3xl pointer-events-none" />

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 p-8 sm:p-10 max-w-md w-full relative z-10 transition-all">
        <div className="flex flex-col items-center text-center">
          <button
            type="button"
            onClick={handleLogoClick}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md border-4 border-white transition-all transform active:scale-95 cursor-pointer relative group overflow-hidden mb-5"
            title="Símbolo Uniodonto"
            aria-label="Logotipo da Uniodonto Passos, clique três vezes para acesso administrativo"
          >
            <div className="absolute inset-0 bg-pink-50 opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
              src="/images/LogoUniodonto.webp"
              alt="Logo Uniodonto Passos"
              className="w-14 h-14 object-contain relative z-10"
              loading="eager"
              draggable={false}
            />
          </button>

          <h2 className="text-[#0F172A] text-xl font-black tracking-tight leading-none mb-1.5 uppercase font-sans">
            Uniodonto Passos
          </h2>

          <div className="inline-block bg-[#FFF0F6] border border-[#CD176D]/15 text-[#CD176D] font-extrabold rounded-full px-4 py-1 text-[9.5px] uppercase tracking-wider mb-4 leading-normal select-none">
            Cooperativa Odontológica
          </div>

          <p className="text-[#64748B] text-xs leading-relaxed max-w-[280px] mb-8 font-medium">
            Painel Consolidado de Análise e Monitoramento de Indicadores
          </p>
        </div>

        <form onSubmit={handleManualLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black tracking-wider text-slate-400 uppercase select-none">
              Usuário ou E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={emailOrUser}
                onChange={(e) => setEmailOrUser(e.target.value)}
                placeholder="Seu usuário ou e-mail"
                className="block w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#CD176D]/10 focus:border-[#CD176D] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black tracking-wider text-slate-400 uppercase select-none">
              Senha de Acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key className="h-4.5 w-4.5 text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                maxLength={32}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha de acesso"
                className="block w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#CD176D]/10 focus:border-[#CD176D] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Esconder senha" : "Ver senha"}
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-600 font-bold flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full mt-4 bg-gradient-to-r from-[#CD176D] to-[#CD176D] hover:opacity-95 disabled:bg-slate-300 text-white font-black text-xs py-3.5 rounded-2xl shadow-md shadow-pink-100 hover:shadow-pink-200 transition-all active:scale-95 cursor-pointer uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Entrar no Painel"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 select-none">
            Desenvolvido Por
          </span>
          <div className="inline-flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-3 py-1 text-[10px] font-extrabold text-[#CD176D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CD176D] animate-pulse" />
            FerTaise Tech
          </div>
        </div>
      </div>

      {logoClicks > 0 && logoClicks < 3 && (
        <div className="absolute bottom-5 right-5 z-50 bg-[#0F172A] text-white rounded-xl px-4 py-2.5 text-[10px] font-bold shadow-md border border-slate-800 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Configuração de Administrador em {3 - logoClicks} cliques...</span>
        </div>
      )}

      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setShowConsentModal(false)} />

          <div className="bg-white rounded-[32px] max-w-2xl w-full max-h-[82vh] flex flex-col shadow-2xl relative z-10 border border-slate-100 overflow-hidden animate-[scaleIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="p-6 md:p-8 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shrink-0 border border-[#CD176D]/10">
                  <ShieldCheck className="w-6 h-6 text-[#CD176D]" />
                </div>
                <div>
                  <h3 className="text-[#0F172A] text-base md:text-lg font-black tracking-tight leading-none mb-1">
                    Termo de Consentimento
                  </h3>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Primeiro Acesso</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                title="Fechar"
                aria-label="Fechar termo de consentimento"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-8 py-5 space-y-6 text-xs text-slate-600 leading-relaxed scrollbar-thin">
              <div className="bg-[#FFF0F6] border border-[#CD176D]/15 p-4 rounded-2xl flex items-start gap-3">
                <FileText className="w-5 h-5 text-[#CD176D] shrink-0 mt-0.5" />
                <p className="text-[#CD176D] font-extrabold text-[11px] leading-relaxed">
                  Esta política regulamenta como a aplicação processa suas credenciais e planilhas, em estrita conformidade com a LGPD.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-tight text-[11px]">1. Finalidade do Tratamento</h4>
                <p>O Dashboard coleta e processa uma quantidade mínima de informações pessoais, exclusivamente para fins de segurança e controle de acessos.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-tight text-[11px]">2. Criptografia & Anonimização</h4>
                <p>Adotamos medidas rígidas de segurança técnica para autenticação e organização dos dados.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-tight text-[11px]">3. Compartilhamento de Dados</h4>
                <p>As informações ficam protegidas e passam a ser sincronizadas no Firebase da organização.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 uppercase tracking-tight text-[11px]">4. Retenção & Exclusão</h4>
                <p>Os dados podem ser revisados e atualizados pelo administrador autorizado conforme necessidade operacional.</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={handleAcceptTerms}
                disabled={isLoggingIn}
                className="bg-[#CD176D] hover:bg-[#A60069] text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer uppercase tracking-wider disabled:opacity-60"
              >
                {isLoggingIn ? "Entrando..." : "Aceitar e Entrar no Painel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
