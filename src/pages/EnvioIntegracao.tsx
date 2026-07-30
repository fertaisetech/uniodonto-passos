import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { 
  FileText, 
  Coins, 
  TrendingUp, 
  FolderOpen, 
  Check, 
  Trash2, 
  Plus, 
  HelpCircle, 
  ChevronRight, 
  AlertTriangle,
  X,
  Info
} from "lucide-react";
import { useMonthlyDashboard } from "../hooks/useMonthlyDashboard";
import { buildRecordFromEnvioState, getCurrentMonthKey, saveMonthlyDashboard, type MonthlyDashboardDocument, type SummaryData } from "../lib/dashboardData";
import { useAppSession } from "../context/AppSessionContext";

// Types
interface ResumoCardItem {
  id: string;
  label: string;
  checked: boolean;
  value: number;
  unit: "PESSOAS" | "LEADS" | "VENDAS" | "R$" | "PTS" | "%";
  tooltip: string;
}

interface InvestimentoItem {
  id: string;
  checked: boolean;
  source: string;
  category: "Ads" | "Software" | "Offline" | "Marketing";
  isFixed: boolean;
  value: number;
}

interface PerformanceMetricItem {
  id: string;
  checked: boolean;
  label: string;
  category: string;
  value: string; // Stored as string to support "150.000", "2,17", "R$ 3,94", etc.
  unit: string;
  isCustomCampaign?: boolean;
}

export function EnvioIntegracao() {
  const [searchParams] = useSearchParams();
  const selectedMonth = searchParams.get("month") || getCurrentMonthKey();
  const { data: dashboardData, loading, error } = useMonthlyDashboard(selectedMonth);
  const { profile } = useAppSession();

  const buildResumoItems = (summary: SummaryData): ResumoCardItem[] => ([
    { id: "ben_ativos", label: "Beneficiários Ativos", checked: true, value: summary.beneficiaries.current, unit: "PESSOAS", tooltip: "Total de beneficiários ativos no mês" },
    { id: "novas_vendas", label: "Novas Vendas (Entradas)", checked: true, value: summary.additions.current, unit: "PESSOAS", tooltip: "Quantidade de novos clientes incluídos" },
    { id: "cancelamentos", label: "Cancelamentos (Exclusões)", checked: true, value: summary.cancellations.current, unit: "PESSOAS", tooltip: "Quantidade de cancelamentos ocorridos no mês" },
    { id: "leads_captados", label: "Leads Captados", checked: true, value: summary.leads.current, unit: "LEADS", tooltip: "Total de leads qualificados captados" },
    { id: "conversoes_efetivas", label: "Conversões Efetivas", checked: true, value: summary.sales.current, unit: "VENDAS", tooltip: "Quantidade total de vendas convertidas" },
    { id: "ltv", label: "Lifetime Value (LTV RS)", checked: true, value: 1220, unit: "R$", tooltip: "Valor médio gerado por cliente ao longo do tempo" },
    { id: "nps", label: "Pontuação NPS (0 a 100)", checked: true, value: summary.nps.current, unit: "PTS", tooltip: "Net Promoter Score indicador de satisfação geral" },
  ]);

  // 1. STATE - Column 1 (Resumo Geral)
  const [resumoItems, setResumoItems] = useState<ResumoCardItem[]>([]);

  // 2. STATE - Column 2 (Investimentos)
  const [investimentos, setInvestimentos] = useState<InvestimentoItem[]>([]);

  // 3. STATE - Column 3 (Tráfego, Canais & Campanhas)
  const [metrics, setMetrics] = useState<PerformanceMetricItem[]>([]);
  const [cancellationReasons, setCancellationReasons] = useState<NonNullable<MonthlyDashboardDocument["cancellationReasons"]>>([]);

  // Modals & UI States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Quick helper to show alerts
  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!dashboardData) return;

    const summary = dashboardData.summary;
    setResumoItems(buildResumoItems(summary));
    setInvestimentos(dashboardData.investments);
    setMetrics(dashboardData.metrics);
    setCancellationReasons(dashboardData.cancellationReasons);
  }, [dashboardData, selectedMonth]);

  // Keep edits available immediately in the local dashboard, even if the user
  // changes month before pressing the explicit save button.
  useEffect(() => {
    if (!dashboardData || investimentos.length === 0 || resumoItems.length === 0) return;
    try {
      const localRecord = buildRecordFromEnvioState({
        month: selectedMonth,
        summary: buildSummaryForSave(),
        beneficiariesData: dashboardData.beneficiariesData,
        funnelData: dashboardData.funnelData,
        npsData: dashboardData.npsData,
        investments: investimentos,
        metrics,
        cancellationReasons,
      });
      localStorage.setItem(`uniodonto_monthly_dashboard_${selectedMonth}`, JSON.stringify(localRecord));
    } catch {
      // The explicit save still reports errors to the user when persistence fails.
    }
  }, [dashboardData, selectedMonth, resumoItems, investimentos, metrics, cancellationReasons]);

  // Math Auto-Updates
  // Total Invested (from checked column 2 rows)
  const totalInvestido = useMemo(() => {
    return investimentos
      .filter(item => item.checked)
      .reduce((acc, curr) => acc + curr.value, 0);
  }, [investimentos]);

  // Leads and Sales helpers
  const leadsCount = resumoItems.find(i => i.id === "leads_captados")?.value || 0;
  const conversoesCount = resumoItems.find(i => i.id === "conversoes_efetivas")?.value || 0;
  const npsScore = resumoItems.find(i => i.id === "nps")?.value || 0;
  const agendamentosCount = Number(metrics.find((item) => item.id === "agend")?.value || 0);

  // Calculates and formats automatically
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  // Derived indicators
  const ticketMedio = 120.00; // base from screenshots
  const calculatedCAC = useMemo(() => {
    if (conversoesCount <= 0) return 0;
    return totalInvestido / conversoesCount;
  }, [totalInvestido, conversoesCount]);

  const calculatedCustoPorLead = useMemo(() => {
    if (leadsCount <= 0) return 0;
    return totalInvestido / leadsCount;
  }, [totalInvestido, leadsCount]);

  // ROI derived: (Revenue - Investment) / Investment * 100
  // In screen 2: ROI (Retorno sobre Invest.) is 9.575,00 % which matches total conversions * lifetime value or similar scale?
  // Let's use a dynamic display that recalculates beautifully based on total_revenue / total_invested * 100 or stick to user screenshot metrics
  const calculatedROI = useMemo(() => {
    if (totalInvestido <= 0) return 0;
    const ltvVal = resumoItems.find(i => i.id === "ltv")?.value || 0;
    const estimatedValue = conversoesCount * ltvVal;
    return (estimatedValue / totalInvestido) * 100;
  }, [totalInvestido, conversoesCount, resumoItems]);

  const buildSummaryForSave = (): SummaryData => {
    const makeMetric = (current: number, previous: number, target?: number) => ({
      current,
      previous,
      variation: previous === 0 ? 0 : Number((((current - previous) / previous) * 100).toFixed(1)),
      target,
    });

    return {
      beneficiaries: makeMetric(resumoItems.find((item) => item.id === "ben_ativos")?.value || 0, baseSummary.beneficiaries.previous, baseSummary.beneficiaries.target),
      additions: makeMetric(resumoItems.find((item) => item.id === "novas_vendas")?.value || 0, baseSummary.additions.previous, baseSummary.additions.target),
      cancellations: makeMetric(resumoItems.find((item) => item.id === "cancelamentos")?.value || 0, baseSummary.cancellations.previous, baseSummary.cancellations.target),
      investment: makeMetric(totalInvestido, baseSummary.investment.previous, baseSummary.investment.target),
      roi: makeMetric(Number(calculatedROI.toFixed(2)), baseSummary.roi.previous, baseSummary.roi.target),
      leads: makeMetric(leadsCount, baseSummary.leads.previous, baseSummary.leads.target),
      appointments: makeMetric(agendamentosCount, baseSummary.appointments.previous, baseSummary.appointments.target),
      sales: makeMetric(conversoesCount, baseSummary.sales.previous, baseSummary.sales.target),
      cac: makeMetric(Number((conversoesCount > 0 ? totalInvestido / conversoesCount : 0).toFixed(2)), baseSummary.cac.previous, baseSummary.cac.target),
      nps: makeMetric(npsScore, baseSummary.nps.previous, baseSummary.nps.target),
    };
  };

  // Actions for Column 1 (Resumo geral)
  const handleToggleResumo = (id: string) => {
    setResumoItems(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleUpdateResumoValue = (id: string, newVal: string) => {
    const num = Math.max(0, Number(newVal) || 0);
    // Update both column 1 inputs and trigger updates in column 3 matching values
    setResumoItems(prev => prev.map(item => item.id === id ? { ...item, value: num } : item));

    // Side-effects: sync leads_captados in Column 1 with "Leads por Canal" in Column 3
    if (id === "leads_captados") {
      setMetrics(prev => prev.map(m => m.id === "leads_canal" ? { ...m, value: String(num) } : m));
    }
    // and sync conversões efetivas
    if (id === "conversoes_efetivas") {
      setMetrics(prev => prev.map(m => m.id === "conv_canal" || m.id === "vendas_canal" ? { ...m, value: String(num) } : m));
    }
  };

  // Actions for Column 2 (Investimentos)
  const handleToggleInvestimento = (id: string) => {
    setInvestimentos(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleToggleFixoInvestimento = (id: string) => {
    setInvestimentos(prev => prev.map(item => item.id === id ? { ...item, isFixed: !item.isFixed } : item));
  };

  const handleUpdateInvestimentoSource = (id: string, s: string) => {
    setInvestimentos(prev => prev.map(item => item.id === id ? { ...item, source: s } : item));
  };

  const handleUpdateInvestimentoCategory = (id: string, cat: InvestimentoItem["category"]) => {
    setInvestimentos(prev => prev.map(item => item.id === id ? { ...item, category: cat } : item));
  };

  const handleUpdateInvestimentoValue = (id: string, val: string) => {
    const num = Math.max(0, Number(val) || 0);
    setInvestimentos(prev => prev.map(item => item.id === id ? { ...item, value: num } : item));
  };

  const handleDeleteInvestimento = (id: string) => {
    setInvestimentos(prev => prev.filter(item => item.id !== id));
    triggerToast("Canal de investimento removido.", "success");
  };

  const handleAddInvestimento = () => {
    const categories: ("Ads" | "Software" | "Offline" | "Marketing")[] = ["Ads", "Software", "Offline", "Marketing"];
    const newItem: InvestimentoItem = {
      id: String(Date.now()),
      checked: true,
      source: "Novo Canal",
      category: "Ads",
      isFixed: false,
      value: 0
    };
    setInvestimentos(prev => [...prev, newItem]);
    triggerToast("Canal de investimento adicionado.", "success");
  };

  // Actions for Column 3 (Tráfego)
  const handleToggleMetric = (id: string) => {
    setMetrics(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleUpdateMetricValue = (id: string, val: string) => {
    setMetrics(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));

    // Side-effects: if user changes "Leads por Canal" manually, sync in Column 1
    if (id === "leads_canal") {
      const num = Number(val.replace(/\D/g, '')) || 0;
      setResumoItems(prev => prev.map(item => item.id === "leads_captados" ? { ...item, value: num } : item));
    }
    if (id === "conv_canal") {
      const num = Number(val.replace(/\D/g, '')) || 0;
      setResumoItems(prev => prev.map(item => item.id === "conversoes_efetivas" ? { ...item, value: num } : item));
    }
  };

  const handleUpdateMetricLabel = (id: string, s: string) => {
    setMetrics(prev => prev.map(item => item.id === id ? { ...item, label: s } : item));
  };

  const handleUpdateMetricCategory = (id: string, s: string) => {
    setMetrics(prev => prev.map(item => item.id === id ? { ...item, category: s } : item));
  };

  const handleDeleteMetric = (id: string) => {
    setMetrics(prev => prev.filter(item => item.id !== id));
    triggerToast("Campanha / métrica removida.", "success");
  };

  const handleAddMetric = () => {
    const newItem: PerformanceMetricItem = {
      id: String(Date.now()),
      checked: true,
      label: "Nova Campanha Ads",
      category: "Google Ads",
      value: "Clique",
      unit: "",
      isCustomCampaign: true
    };
    setMetrics(prev => [...prev, newItem]);
    triggerToast("Nova campanha de tráfego adicionada.", "success");
  };

  // Submission Flow
  const handleConfirmAll = () => {
    setShowSubmitModal(true);
  };

  const executeSubmission = async () => {
    setIsSubmitting(true);
    try {
      const record = buildRecordFromEnvioState({
        month: selectedMonth,
        summary: buildSummaryForSave(),
        beneficiariesData: dashboardData.beneficiariesData,
        funnelData: dashboardData.funnelData,
        npsData: dashboardData.npsData,
        investments: investimentos,
        metrics,
        cancellationReasons,
      });

      const saveResult = await saveMonthlyDashboard(selectedMonth, record, profile);
      setShowSubmitModal(false);
      triggerToast(
        saveResult.remoteSaved
          ? `Mês ${selectedMonth} salvo e sincronizado.`
          : `Mês ${selectedMonth} salvo localmente.`,
        "success"
      );
    } catch (error) {
      triggerToast("Não foi possível salvar o mês. Tente novamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleHeaderSave = () => {
      void executeSubmission();
    };
    window.addEventListener("save-monthly-dashboard", handleHeaderSave);
    return () => window.removeEventListener("save-monthly-dashboard", handleHeaderSave);
  }, [selectedMonth, dashboardData, profile, investimentos, metrics, resumoItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#A60069] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="max-w-lg w-full rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <h2 className="text-lg font-black">Dados do mês não sincronizados</h2>
          <p className="mt-2 text-sm font-medium text-amber-800">
            {error || "Ainda não encontramos dados reais para este mês no Firestore."}
          </p>
          <p className="mt-3 text-xs text-amber-700">
            Use a rotina de sincronização do backend para carregar a planilha e depois tente novamente.
          </p>
        </div>
      </div>
    );
  }

  const baseSummary = dashboardData.summary;

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      
      {/* 2. DYNAMIC 3-COLUMN INTUITIVE PANEL GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 overflow-hidden min-h-0">
        
        {/* COLUMN 1: RESUMO GERAL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0">
          {/* Section Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-[#CD176D] border border-pink-100">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-800 tracking-wider uppercase">Resumo Geral</h2>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Indicadores-chave do mês</span>
              </div>
            </div>

            <button
              onClick={executeSubmission}
              className="bg-[#FFF5F9] hover:bg-pink-100 text-[#CD176D] border border-pink-150/70 font-black text-[10px] px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              type="button"
              title="Salvar mês no banco"
            >
              <Check className="w-3 h-3 stroke-[3]" />
              <span>Salvar mês</span>
            </button>
          </div>

          {/* Section Content (Form inputs, scrollable internally if overflowing) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {resumoItems.map((item) => (
              <div 
                key={item.id} 
                className={`flex items-center justify-between py-1 px-1.5 rounded-xl transition-all duration-150 ${
                  item.checked ? "hover:bg-slate-50/70" : "opacity-45 hover:opacity-75"
                }`}
              >
                {/* Left Row Meta info */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleResumo(item.id)}
                    className="w-4.5 h-4.5 rounded-lg border-slate-300 text-[#CD176D] focus:ring-[#CD176D]/20 cursor-pointer"
                    id={`check_${item.id}`}
                  />
                  <label 
                    htmlFor={`check_${item.id}`}
                    className="text-[11px] font-black tracking-wide text-slate-700 capitalize cursor-pointer select-none truncate hover:text-[#CD176D] transition-colors"
                  >
                    {item.label}
                  </label>
                  <div className="group relative">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors cursor-help shrink-0" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-44 p-2 bg-slate-800 text-white text-[9px] font-bold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-10 leading-normal">
                      {item.tooltip}
                    </div>
                  </div>
                </div>

                {/* Right Row Pill Input wrapper */}
                <div className="bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-200/90 focus-within:border-[#CD176D] focus-within:ring-2 focus-within:ring-[#CD176D]/10 flex items-center pr-3 pl-2.5 py-1.5 rounded-2xl w-28 sm:w-32 transition-all">
                  <input
                    type="number"
                    disabled={!item.checked}
                    value={item.value}
                    onChange={(e) => handleUpdateResumoValue(item.id, e.target.value)}
                    className="w-full text-right outline-none text-xs font-black text-slate-800 bg-transparent disabled:text-slate-400 disabled:cursor-not-allowed font-mono"
                    aria-label={item.label}
                  />
                  <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase pl-2 w-14 shrink-0 text-right select-none">
                    {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Section Summary Row Footer (Always Visible, Non-Scrollable) */}
          <div className="bg-slate-50/70 py-3.5 px-4 border-t border-slate-100 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-650 font-bold flex items-center gap-1.5">Ticket Médio</span>
              <span className="text-slate-800 font-extrabold font-mono">
                {formatBRL(ticketMedio)} <span className="text-[9px] text-slate-400 uppercase font-sans">R$</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11.5px]">
              <span className="text-slate-700 font-black">CAC (Custo de Aquisição)</span>
              <span className="text-[#CD176D] font-black font-mono text-[12.5px]">
                {formatBRL(calculatedCAC)} <span className="text-[9px] text-[#CD176D]/70 uppercase font-sans font-bold">R$</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-650 font-semibold">ROI (Retorno sobre Invest.)</span>
              <span className="text-emerald-600 font-extrabold font-mono text-[12px]">
                {formatBRL(calculatedROI)} <span className="text-[9px] text-emerald-500 uppercase font-sans font-bold">%</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-655 font-semibold">Meta de Conversão</span>
              <span className="text-indigo-600 font-extrabold font-mono leading-none">
                0,00 <span className="text-[9px] text-indigo-400 uppercase font-sans font-bold">%</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-650 font-bold">Satisfação Geral (NPS)</span>
              <span className="text-emerald-500 font-black font-mono">
                {npsScore} <span className="text-[9px] text-emerald-400 uppercase font-sans font-bold">%</span>
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Cancelamentos por motivo</h3>
              <span className="text-[9px] text-slate-500 font-bold block mt-0.5 mb-2">Motivos registrados no mês</span>
              <div className="space-y-2">
                {cancellationReasons.map((item) => (
                  <label key={item.reason} className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-700">
                    <span>{item.reason}</span>
                    <input type="number" min="0" value={item.count} onChange={(e) => {
                      const count = Math.max(0, Number(e.target.value) || 0);
                      setCancellationReasons((current) => current.map((entry) => entry.reason === item.reason ? { ...entry, count } : entry));
                    }} className="w-14 rounded-lg border border-slate-200 px-1.5 py-1 text-right text-[10px] font-black text-[#CD176D] outline-none focus:border-[#CD176D]" />
                  </label>
                ))}
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] font-black">
                <span>Total</span><span className="text-[#CD176D]">{cancellationReasons.reduce((sum, item) => sum + item.count, 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: INVESTIMENTOS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0">
          {/* Section Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-[#CD176D] border border-pink-100">
                <Coins className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-800 tracking-wider uppercase">Investimentos</h2>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Despesas por canal / fonte</span>
              </div>
            </div>

            <button
              onClick={handleAddInvestimento}
              className="bg-[#FFF5F9] hover:bg-pink-105/90 text-[#CD176D] border border-pink-150/70 font-black text-[10px] px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              type="button"
              title="Adicionar Canal"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Adicionar</span>
            </button>
          </div>

          {/* Section Table Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-1">
            <table className="w-full text-left border-collapse table-auto">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 pl-4 w-10">
                    {/* Header empty space for check */}
                  </th>
                  <th className="py-2.5">Canal / Fonte</th>
                  <th className="py-2.5 text-center w-20">Cat.</th>
                  <th className="py-2.5 text-center w-12">Fixo</th>
                  <th className="py-2.5 text-right pr-4 w-24">Valor</th>
                  <th className="py-2.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {investimentos.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/50 transition-colors group ${
                      item.checked ? "" : "opacity-45 hover:opacity-75"
                    }`}
                  >
                    {/* Checkbox column */}
                    <td className="py-2 pl-4">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleInvestimento(item.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#CD176D] focus:ring-[#CD176D]/20 cursor-pointer"
                        title="Ativar/Inativar canal"
                        aria-label="Selecionar canal de investimento"
                      />
                    </td>

                    {/* Source Name Column */}
                    <td className="py-2">
                      <input
                        type="text"
                        disabled={!item.checked}
                        value={item.source}
                        onChange={(e) => handleUpdateInvestimentoSource(item.id, e.target.value)}
                        className="w-full text-xs font-bold text-slate-700 bg-transparent outline-none focus:border-b focus:border-[#CD176D] disabled:text-slate-400"
                        title="Editar nome do canal"
                        placeholder="Nome do canal"
                      />
                    </td>

                    {/* Category Dropdown */}
                    <td className="py-2 text-center">
                      <select
                        disabled={!item.checked}
                        value={item.category}
                        onChange={(e) => handleUpdateInvestimentoCategory(item.id, e.target.value as InvestimentoItem["category"])}
                        className="text-[10px] font-extrabold border border-slate-100 rounded-lg p-1 bg-slate-50/50 hover:bg-white outline-none cursor-pointer text-slate-805 disabled:opacity-50"
                        title="Categoria"
                        aria-label="Selecionar categoria de investimento"
                      >
                        <option value="Ads">Ads</option>
                        <option value="Software">Software</option>
                        <option value="Offline">Offline</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </td>

                    {/* Fixo Toggle checkbox */}
                    <td className="py-2 text-center">
                      <input
                        type="checkbox"
                        disabled={!item.checked}
                        checked={item.isFixed}
                        onChange={() => handleToggleFixoInvestimento(item.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-slate-600 focus:ring-slate-205 cursor-pointer disabled:cursor-not-allowed"
                        title="Despesa Fixa?"
                        aria-label="Informa se é custo fixo"
                      />
                    </td>

                    {/* Value Field Column */}
                    <td className="py-2 text-right pr-2">
                      <div className="flex items-center justify-end bg-slate-50 focus-within:bg-white focus-within:ring-1 focus-within:ring-[#CD176D]/40 border border-slate-200/60 rounded-xl px-1.5 py-1 w-20 ml-auto select-all">
                        <input
                          type="number"
                          disabled={!item.checked}
                          value={item.value || ""}
                          onChange={(e) => handleUpdateInvestimentoValue(item.id, e.target.value)}
                          placeholder="0,00"
                          className="w-full text-right outline-none text-[11px] font-black font-mono text-slate-850 bg-transparent disabled:text-slate-400"
                          title="Valor investido"
                          aria-label="Registrar valor de investimento"
                        />
                      </div>
                    </td>

                    {/* Elimination row */}
                    <td className="py-2 text-center">
                      <button
                        onClick={() => handleDeleteInvestimento(item.id)}
                        className="p-1 rounded-md text-slate-300 hover:text-red-600 hover:bg-red-50/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Deletar este canal"
                        aria-label="Excluir canal"
                        type="button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer with sum total calculated live (Non-Scrollable) */}
          <div className="bg-slate-50/70 p-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black tracking-wider text-[#64748B] uppercase select-none">
              Total Investido
            </span>
            <span className="text-sm font-black text-[#CD176D] font-mono leading-none tracking-tight">
              R$ {formatBRL(totalInvestido)}
            </span>
          </div>
        </div>

        {/* COLUMN 3: TRÁFEGO, CANAIS & CAMPANHAS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden min-h-0">
          {/* Section Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-[#CD176D] border border-pink-100">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-800 tracking-wider uppercase">Tráfego & Campanhas</h2>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Métricas de performance por fonte</span>
              </div>
            </div>

            <button
              onClick={handleAddMetric}
              className="bg-[#FFF5F9] hover:bg-pink-105/90 text-[#CD176D] border border-pink-150/70 font-black text-[10px] px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 active:scale-95"
              type="button"
              title="Adicionar Campanha Ads"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Adicionar</span>
            </button>
          </div>

          {/* Performance Table */}
          <div className="flex-1 overflow-y-auto pr-1 overflow-x-hidden min-h-0">
            <table className="w-full text-left border-collapse table-auto">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-wider select-none">
                <tr>
                  <th className="py-2.5 pl-4 w-9"></th>
                  <th className="py-2.5">Nome / Métrica</th>
                  <th className="py-2.5 text-center w-24">Canal / Fonte</th>
                  <th className="py-2.5 text-right pr-4 w-28">Valor / Métrica</th>
                  <th className="py-2.5 text-center w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {metrics.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/50 transition-colors group ${
                      item.checked ? "" : "opacity-45 hover:opacity-75"
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2 pl-4">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleMetric(item.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#CD176D] focus:ring-[#CD176D]/25 cursor-pointer"
                        title="Ativar/inativar métrica"
                        aria-label="Selecionar métrica de tráfego"
                      />
                    </td>

                    {/* Metric Name */}
                    <td className="py-2">
                      <input
                        type="text"
                        disabled={!item.checked || !item.isCustomCampaign}
                        value={item.label}
                        onChange={(e) => handleUpdateMetricLabel(item.id, e.target.value)}
                        className={`text-xs bg-transparent outline-none ${
                          item.isCustomCampaign 
                            ? "font-bold text-slate-700 focus:border-b focus:border-[#CD176D]" 
                            : "font-bold text-slate-650"
                        }`}
                        title="Editar nome da métrica"
                        placeholder="Métrica"
                      />
                    </td>

                    {/* Source Channel label */}
                    <td className="py-2 text-center">
                      {item.isCustomCampaign ? (
                        <select
                          disabled={!item.checked}
                          value={item.category}
                          onChange={(e) => handleUpdateMetricCategory(item.id, e.target.value)}
                          className="text-[9px] font-extrabold border border-slate-100 rounded-lg p-1 bg-slate-50/40 hover:bg-white outline-none cursor-pointer text-slate-700"
                          title="Selecione o canal"
                          aria-label="Selecionar canal da campanha"
                        >
                          <option value="Google Ads">Google Ads</option>
                          <option value="Meta Ads">Meta Ads</option>
                          <option value="Orgânico">Orgânico</option>
                          <option value="Todos">TODOS</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-black text-slate-450 uppercase shrink-0">
                          {item.category}
                        </span>
                      )}
                    </td>

                    {/* Value Field */}
                    <td className="py-2 text-right pr-2">
                      <div className="flex items-center justify-end bg-slate-5/40 focus-within:bg-white border border-slate-200/50 rounded-xl px-1.5 py-1 w-24 ml-auto">
                        <input
                          type="text"
                          disabled={!item.checked || item.id === "ctr" || item.id === "cpc"}
                          value={
                            item.id === "ctr" 
                              ? `${formatBRL(3250 / 150000 * 100)} %` 
                              : item.id === "cpc" 
                                ? `R$ ${formatBRL(totalInvestido / 3250)}` 
                                : item.value
                          }
                          onChange={(e) => handleUpdateMetricValue(item.id, e.target.value)}
                          placeholder="Valor"
                          className="w-full text-right outline-none text-[11px] font-black font-mono text-slate-800 bg-transparent disabled:text-slate-500 disabled:font-bold disabled:cursor-not-allowed"
                          title="Valor medido"
                          aria-label="Registrar valor medido"
                        />
                        {item.unit && (
                          <span className="text-[8px] text-slate-400 font-extrabold select-none pl-1 shrink-0 uppercase">
                            {item.unit === "R$" ? "" : item.unit}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Custom Campaigns Delete trash icon */}
                    <td className="py-2 text-center">
                      {item.isCustomCampaign ? (
                        <button
                          onClick={() => handleDeleteMetric(item.id)}
                          className="p-1 rounded-md text-slate-300 hover:text-red-655 hover:bg-red-50/50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Deletar esta campanha"
                          aria-label="Deletar campanha de tráfego"
                          type="button"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section table footer (Custo por Lead calculated live) */}
          <div className="bg-slate-50/70 p-4 border-t border-slate-100 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wide">
              <span className="text-[#CD176D] font-black">Custo por Lead (CPL)</span>
              <span className="text-[#CD176D] text-sm font-black font-mono">
                R$ {formatBRL(calculatedCustoPorLead)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. SUBMIT ALL CONFIRMATION DIALOG MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden select-none animate-[fadeIn_0.15s_ease-out]">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-[#CD176D]/10 text-[#CD176D] flex items-center justify-center mx-auto mb-4 border border-[#CD176D]/20">
                <FileText className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1.5 uppercase tracking-wide text-center">
                Salvar e Integrar Dados
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed text-center">
                Você está prestes a atualizar os dados de resumo mensal para <span className="font-bold text-slate-900">{selectedMonth}</span>. Deseja aplicar os valores digitados no painel de relatórios ativos?
              </p>

              {/* Quick Math Summary preview inside confirmation modal */}
              <div className="bg-slate-50 rounded-2xl p-4.5 mt-5 space-y-2 border border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-508 font-bold">Investimento Total</span>
                  <span className="text-slate-850 font-extrabold font-mono">R$ {formatBRL(totalInvestido)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-508 font-bold">Total de Leads Captados</span>
                  <span className="text-slate-850 font-extrabold font-mono">{leadsCount} Leads</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-508 font-bold">Custo por Lead Estimado</span>
                  <span className="text-slate-850 font-extrabold font-mono text-[#CD176D]">R$ {formatBRL(calculatedCustoPorLead)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex items-center gap-3 border-t border-slate-150">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
                className="w-1/2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-705 font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-sm text-center uppercase disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeSubmission}
                className="w-1/2 bg-[#CD176D] hover:bg-[#A60069] text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md text-center uppercase flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar no Firebase</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION STATUS TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-[slideUp_0.25s_ease-out] select-none">
          <div className="p-4 rounded-2xl border shadow-xl flex items-center gap-3 bg-[#E6FBF3] border-emerald-200 text-emerald-800">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            </div>
            <div className="flex-1">
              <span className="block text-xs font-black uppercase tracking-wider">Integração</span>
              <span className="block text-xs font-semibold text-slate-700 mt-0.5">
                {toast.message}
              </span>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className="text-slate-400 hover:text-slate-650 p-0.5 cursor-pointer ml-1"
              type="button"
              aria-label="Fechar notificação"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
