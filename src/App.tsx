import { Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { VisaoGeral } from "./pages/VisaoGeral";
import { Relatorios } from "./pages/Relatorios";
import { Configuracoes } from "./pages/Configuracoes";
import { EnvioIntegracao } from "./pages/EnvioIntegracao";
import { LoginPage } from "./components/LoginPage";
import { AppSessionProvider, useAppSession } from "./context/AppSessionContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
        <Route index element={<VisaoGeral />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="envio-integracao" element={<EnvioIntegracao />} />
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
