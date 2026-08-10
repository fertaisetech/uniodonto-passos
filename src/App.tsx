import { Routes, Route, Navigate } from "react-router";
import type { ReactNode } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { VisaoGeral } from "./pages/VisaoGeral";
import { Relatorios } from "./pages/Relatorios";
import { Configuracoes } from "./pages/Configuracoes";
import { EnvioIntegracao } from "./pages/EnvioIntegracao";
import { Comunicacao } from "./pages/Comunicacao";
import { AppVendas } from "./pages/AppVendas";
import { LoginPage } from "./components/LoginPage";
import { AppSessionProvider, useAppSession } from "./context/AppSessionContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { canAccessScreen, type ScreenKey } from "./lib/screenAccess";

function ScreenGuard({ screen, children }: { screen: ScreenKey; children: ReactNode }) {
  const { profile } = useAppSession();
  return canAccessScreen(profile?.role, screen) ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  const { profile, loading } = useAppSession();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-[#CD176D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ScreenGuard screen="visaoGeral"><VisaoGeral /></ScreenGuard>} />
        <Route path="dashboard" element={<ScreenGuard screen="dashboard"><Dashboard /></ScreenGuard>} />
        <Route path="relatorios" element={<ScreenGuard screen="relatorios"><Relatorios /></ScreenGuard>} />
        <Route path="configuracoes" element={<ScreenGuard screen="configuracoes"><Configuracoes /></ScreenGuard>} />
        <Route path="envio-integracao" element={<ScreenGuard screen="envio"><EnvioIntegracao /></ScreenGuard>} />
        <Route path="comunicacoes" element={<ScreenGuard screen="comunicacoes"><Comunicacao /></ScreenGuard>} />
        <Route path="comunicacao" element={<Comunicacao />} />
        <Route path="app-vendas" element={<ScreenGuard screen="appVendas"><AppVendas /></ScreenGuard>} />
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <h1 className="text-2xl font-bold text-text-primary">Em Desenvolvimento</h1>
            <p className="text-text-secondary mt-2">Esta visualização será liberada na próxima fase.</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppSessionProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </AppSessionProvider>
  );
}
