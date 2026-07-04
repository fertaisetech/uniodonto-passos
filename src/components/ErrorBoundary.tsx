import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Intentionally quiet in production UI; telemetry can be added later.
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-50 text-[#CD176D] flex items-center justify-center text-2xl font-black">
              !
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black text-slate-900">Algo saiu do esperado</h1>
              <p className="text-sm text-slate-600">
                A interface encontrou um erro e precisou ser interrompida. Você pode recarregar a página para tentar de novo.
              </p>
              {this.state.error?.message && (
                <p className="text-[11px] text-slate-400 font-mono break-words">{this.state.error.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full bg-[#CD176D] hover:bg-[#A60069] text-white font-black text-xs py-3.5 rounded-2xl transition-all"
            >
              Recarregar aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
