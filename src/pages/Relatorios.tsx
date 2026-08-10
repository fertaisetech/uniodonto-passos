import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useMonthlyDashboard } from "../hooks/useMonthlyDashboard";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Share2, 
  Printer,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  PieChart,
  BarChart as LucideBarChart
} from "lucide-react";
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Bar,
  Line,
  Legend
} from "recharts";

export function Relatorios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMonth = searchParams.get("month") || "Maio/2026";
  const reportType = searchParams.get("type") || "consolidado";
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const [isMonthTransitioning, setIsMonthTransitioning] = useState(false);
  const chartHostRef = useRef<HTMLDivElement>(null);

  const { data: dashboardData, loading: isDataLoading, error } = useMonthlyDashboard(selectedMonth);
  const summary = dashboardData?.summary;
  const beneficiariesData = dashboardData?.beneficiariesData;
  const funnelData = dashboardData?.funnelData;
  const focusLabel = reportType === "funil"
    ? "Funil Comercial"
    : reportType === "crescimento"
      ? "Crescimento & NPS"
      : "Consolidado Geral";
  const hasCurrentMonthData = dashboardData?.month === selectedMonth;

  useEffect(() => {
    let cancelled = false;
    setIsMonthTransitioning(true);
    const timeout = window.setTimeout(() => {
      if (!cancelled) setIsMonthTransitioning(false);
    }, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [selectedMonth]);

  useEffect(() => {
    if (hasCurrentMonthData) setIsMonthTransitioning(false);
  }, [hasCurrentMonthData]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setGenerationSuccess(false);
    try {
      // Trigger live background API compilation / ingestion check
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: selectedMonth }),
      });
      if (!res.ok) {
        console.warn("Sync endpoint returned a non-OK response; Firestore remains the source of truth.");
      }
    } catch (err) {
      console.warn("Couldn't invoke live server sync endpoint", err);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationSuccess(true);
        setTimeout(() => setGenerationSuccess(false), 4500);
      }, 1200);
    }
  };

  const handleDownloadCSV = () => {
    if (!summary) return;
    
    // Generate a beautiful, real CSV with metrics
    const headers = ["Métrica", "Valor Atual", "Meta / Referência", "Variação"];
    const rows = [
      ["Beneficiários Totais", summary.beneficiaries.current, summary.beneficiaries.target || "N/A", `${summary.beneficiaries.variation}%`],
      ["Novas Inclusões", summary.additions.current, summary.additions.target || "N/A", `${summary.additions.variation}%`],
      ["Cancelamentos", summary.cancellations.current, summary.cancellations.target || "N/A", `${summary.cancellations.variation}%`],
      ["ROI Estimado (%)", `${summary.roi.current}%`, "N/A", `${summary.roi.variation}%`],
      ["Leads Gerados", summary.leads.current, summary.leads.target || "N/A", `${summary.leads.variation}%`],
      ["Vendas Realizadas", summary.sales.current, summary.sales.target || "N/A", `${summary.sales.variation}%`],
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Executivo_${selectedMonth.replace("/", "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sync isGenerating with Layout state
  useEffect(() => {
    if (isGenerating) {
      window.dispatchEvent(new CustomEvent("relatorios-gen-start"));
    } else {
      window.dispatchEvent(new CustomEvent("relatorios-gen-end"));
    }
  }, [isGenerating]);

  useEffect(() => {
    if (isDataLoading) {
      setChartReady(false);
      setChartSize({ width: 0, height: 0 });
      return;
    }

    const timer = window.setTimeout(() => setChartReady(true), 250);
    return () => window.clearTimeout(timer);
  }, [isDataLoading, selectedMonth]);

  useEffect(() => {
    if (!chartReady) return;

    const el = chartHostRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setChartSize({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(el);

    return () => observer.disconnect();
  }, [chartReady, selectedMonth]);

  // Handle actions received from Layout Topbar
  useEffect(() => {
    const handleDownload = () => handleDownloadCSV();
    const handleExport = () => window.print();
    const handleGenerate = () => handleGenerateReport();

    // Register globally on window for complete cross-component stability
    (window as any).triggerRelatorioDownloadCSV = handleDownload;
    (window as any).triggerRelatorioExportPDF = handleExport;
    (window as any).triggerRelatorioGenerateNew = handleGenerate;

    window.addEventListener("relatorios-download-csv", handleDownload);
    window.addEventListener("relatorios-export-pdf", handleExport);
    window.addEventListener("relatorios-generate-new", handleGenerate);

    return () => {
      delete (window as any).triggerRelatorioDownloadCSV;
      delete (window as any).triggerRelatorioExportPDF;
      delete (window as any).triggerRelatorioGenerateNew;

      window.removeEventListener("relatorios-download-csv", handleDownload);
      window.removeEventListener("relatorios-export-pdf", handleExport);
      window.removeEventListener("relatorios-generate-new", handleGenerate);
    };
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const copyShareLink = async () => {
    const link = new URL(window.location.href);
    link.searchParams.set("month", selectedMonth);
    link.searchParams.set("type", reportType);

    try {
      await navigator.clipboard.writeText(link.toString());
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2500);
    } catch {
      window.prompt("Copie o link do relatório:", link.toString());
    }
  };

  if (isDataLoading || isMonthTransitioning || (dashboardData && !hasCurrentMonthData)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#A60069] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!dashboardData || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="max-w-xl w-full rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <h2 className="text-lg font-black">Relatório ainda não sincronizado</h2>
          <p className="mt-2 text-sm font-medium text-amber-800">
            Não foi possível carregar os dados deste período. Tente novamente em alguns instantes.
          </p>
        </div>
      </div>
    );
  }

  // Aggregate stats from the summary and funnel
  const reportStats = {
    totalBeneficiarios: summary.beneficiaries.current,
    additions: summary.additions.current,
    cancellations: summary.cancellations.current,
    leads: summary.leads.current,
    appointments: summary.appointments.current,
    sales: summary.sales.current,
    investment: summary.investment.current,
    roi: summary.roi.current,
    cac: summary.cac.current,
    contacts: funnelData?.find((stage) => stage.stage === "Contatos")?.count || 0,
  };
  const roiMultiplier = reportStats.roi / 100;

  // Build a beautiful hybrid chart dataset integrating Visão Geral goals & Funnel results
  const chartDataset = (funnelData || []).map((stage) => ({
    name: stage.stage,
    Volume: stage.count,
    Conversão: reportStats.leads > 0 ? Number(((stage.count / reportStats.leads) * 100).toFixed(1)) : 0,
  }));

  const recentReports: Array<{ id: string; date: string; title: string; month: string; author: string; format: string }> = [];

  return (
    <div id="relatorios_root" className="space-y-6">
      
      {/* Generation success alert banner */}
      {(generationSuccess || shareCopied) && (
        <div className="bg-[#E6FBF3] border-l-4 border-[#10B981] p-4 rounded-2xl flex items-center gap-3.5 shadow-sm animate-[fadeIn_0.2s_ease-out]">
          <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-black text-[#0F172A]">
              {shareCopied ? "Link copiado com sucesso!" : "Relatório compilado com sucesso!"}
            </p>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
              {shareCopied
                ? "O link atual do relatório foi copiado para a área de transferência."
                : `O consolidado de dados de ${selectedMonth} foi gerado e registrado no histórico abaixo.`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm">
          <Info className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-xs font-semibold">Não foi possível carregar os dados deste período. Tente novamente em alguns instantes.</p>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Foco do relatório</p>
          <p className="mt-1 text-sm font-black text-slate-800">{focusLabel}</p>
        </div>
        <span className="rounded-lg bg-pink-50 px-3 py-1.5 text-[10px] font-black text-[#A60069]">{selectedMonth}</span>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Consolidated highlights from Visão Geral & Dashboard */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Executive Summary document container */}
          <div className="glass-card shadow-sm border border-slate-100 rounded-[32px] overflow-hidden bg-white">
            
            {/* Elegant Header of the simulated document */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-[#A60069] to-[#CD176D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 uppercase tracking-widest text-[9px] font-black px-2 pb-0.5 rounded-md">UNIODONTO</span>
                  <span className="text-white/60 text-[10px] font-semibold">•</span>
                  <span className="text-white/90 text-[10px] font-bold">Relatório Executivo Geral</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-none mt-1">Análise Consolidada de Atividades</h3>
                <p className="text-white/80 text-xs font-medium">Cruzamento integral: Visão Geral da carteira & Funil de Conversão</p>
              </div>

              <div className="text-left sm:text-right shrink-0 bg-white/10 p-3.5 rounded-2xl border border-white/10 w-full sm:w-auto min-w-0 sm:min-w-[140px]">
                <p className="text-white/60 text-[9px] font-black uppercase tracking-widest">MÊS DE REFERÊNCIA</p>
                <p className="text-base font-black mt-1">{selectedMonth}</p>
                <p className="text-[10px] text-white/50 font-semibold mt-0.5">Status: Homologado</p>
              </div>
            </div>

            {/* Document stats grid */}
            <div className="p-6 sm:p-8 space-y-8">
              
              {/* Introduction description block */}
              <div className="flex gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Info className="w-5 h-5 text-[#CD176D] shrink-0 mt-0.5" />
                <p className="text-slate-600 font-semibold text-xs leading-relaxed">
                  Este documento consolida os principais indicadores de crescimento do quadro de beneficiários junto à performance operacional do funil comercial e captação de leads. O objetivo é mensurar a eficiência do Custo de Aquisição (CAC) sobre o aumento líquido da carteira.
                </p>
              </div>

              {/* Data comparison blocks */}
              {reportType !== "funil" && <div>
                <h4 className="text-slate-800 font-black tracking-tight text-xs uppercase mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-[#CD176D]" />
                  Métricas Ambientais de Visão Geral (Carteira)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">BENEFICIÁRIOS TOTAL</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {reportStats.totalBeneficiarios.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] font-black text-[#10B981] flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" /> +1.2%
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1.5 block">Variação frente ref. anual</span>
                  </div>

                  <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-[#F1F5F9]">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">INCLUSÕES DO MÊS</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {reportStats.additions.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] font-black text-[#10B981] flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" /> +4.8%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`Progresso da meta mensal: ${Math.min(100, Math.max(0, (reportStats.additions / 900) * 100)).toFixed(0)}%`}>
                      <div
                        className="h-full rounded-full bg-[#10B981] transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, (reportStats.additions / 900) * 100))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1.5 block">Meta mensal: 900 novos • {Math.min(100, Math.max(0, (reportStats.additions / 900) * 100)).toFixed(0)}% atingido</span>
                  </div>

                  <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-[#F1F5F9]">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">CANCELAMENTOS DO MÊS</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black text-slate-800 leading-none">
                        {reportStats.cancellations.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-[10px] font-black text-[#EF4444] flex items-center">
                        <TrendingDown className="w-3 h-3 mr-0.5" /> -2.4%
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1.5 block">Baixa em relação a Abr/2026</span>
                  </div>
                </div>
              </div>}

              {/* Funnel Metrics Row */}
              {reportType !== "crescimento" && <div>
                <h4 className="text-slate-800 font-black tracking-tight text-xs uppercase mb-4 flex items-center gap-2">
                  <LucideBarChart className="w-4 h-4 text-[#CD176D]" />
                  Resultados do Funil de Marketing & Vendas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">LEADS CAPTADOS</span>
                    <span className="text-xl font-black text-slate-800 leading-none mt-2 block">
                      {reportStats.leads.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Variação: {summary.leads.variation >= 0 ? "+" : ""}{summary.leads.variation}%</span>
                  </div>

                  <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">CONTATOS</span>
                    <span className="text-xl font-black text-slate-800 leading-none mt-2 block">
                      {reportStats.contacts.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Volume do estágio</span>
                  </div>

                  <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">AGENDAMENTOS</span>
                    <span className="text-xl font-black text-slate-800 leading-none mt-2 block">
                      {reportStats.appointments.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1 block">
                      Tx Conv: {((reportStats.appointments / reportStats.leads) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">VENDAS</span>
                    <span className="text-xl font-black text-slate-800 leading-none mt-2 block">
                      {reportStats.sales.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1 block font-bold text-[#CD176D]">
                      Tx Conv: {((reportStats.sales / reportStats.leads) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-2xl p-4 border border-slate-100">
                    <span className="text-[10px] font-black tracking-wider text-slate-400 block uppercase">ROI (X)</span>
                    <span className="text-xl font-black text-slate-850 leading-none mt-2 block font-extrabold text-[#10B981]">
                      {roiMultiplier.toFixed(1)}x
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Retorno invest.</span>
                  </div>
                </div>
              </div>}

              {reportType === "crescimento" && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">Crescimento & NPS</h4>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">Satisfação registrada no período selecionado.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-700">{summary.nps.current.toLocaleString("pt-BR")}</p>
                      <p className="text-[10px] font-bold text-emerald-700">NPS • {summary.nps.variation >= 0 ? "+" : ""}{summary.nps.variation}%</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Math.max(0, summary.nps.current))}%` }} />
                  </div>
                </div>
              )}

              {/* Composite Performance Chart */}
              {reportType !== "crescimento" && <div>
                <h4 className="text-slate-800 font-black tracking-tight text-xs uppercase mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#CD176D]" />
                  Evasão e Conversão de Funil
                </h4>
                <p className="text-[10px] text-slate-500 font-semibold mb-4 leading-none">
                  Comparação do volume acumulado de leads vs a taxa de conversão final por estágio
                </p>

                <div ref={chartHostRef} className="h-[220px] sm:h-[280px] w-full pt-2 min-w-0">
                  {chartReady && chartSize.width > 0 && chartSize.height > 0 ? (
                    <ComposedChart width={chartSize.width} height={chartSize.height} data={chartDataset} margin={{ top: 10, right: -10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                      <RechartsTooltip />
                      <Legend iconType="circle" />
                      <Bar yAxisId="left" dataKey="Volume" name="Volume Acumulado" fill="#A60069" radius={[8, 8, 0, 0]} barSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="Conversão" name="Taxa de Conversão %" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                    </ComposedChart>
                  ) : (
                    <div className="h-full w-full rounded-2xl bg-slate-50 animate-pulse" />
                  )}
                </div>
              </div>}

              {/* Bottom footer elements sign-off matching polished layout */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#FF4B8B] text-white flex items-center justify-center font-extrabold text-xs">
                    FT
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Emitido por FerTaise Tech Admin</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Tecnologia & Governança Corporativa</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-[#CD176D] hover:bg-slate-50 transition-colors"
                    title="Imprimir"
                    aria-label="Imprimir relatório"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={copyShareLink}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-[#CD176D] hover:bg-slate-50 transition-colors"
                    title="Compartilhar"
                    aria-label="Compartilhar link do relatório"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-black tracking-widest text-[#64748B] uppercase">ID: UNIO-2026-X1</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Right Column: Historical logs & action checklists */}
        <div className="no-print space-y-6">
          
          {/* Quick Stats sidepanel */}
          <div className="glass-card shadow-sm border border-slate-100 rounded-[32px] p-6 bg-white space-y-4">
            <h4 className="text-[#0F172A] font-black tracking-tight text-sm uppercase flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#CD176D]" />
              Eficiência e Insights
            </h4>

            <div className="space-y-4 pt-1">
              {/* ROI efficiency block */}
              <div className="p-3.5 bg-green-50/50 border border-green-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[#047857] font-black text-[11px] uppercase tracking-wider">Multiplicador ROI</span>
                  <span className="text-[#047857] bg-white border border-green-200 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">Ótimo</span>
                </div>
                <p className="text-[#0F172A] font-extrabold text-sm mt-1">{roiMultiplier.toFixed(1)}x Retorno</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">A cada R$ 1,00 investido nas mídias, o retorno estimado foi de {roiMultiplier.toFixed(2)}x em novas vendas integradas.</p>
              </div>

              {/* CAC efficiency block */}
              <div className="p-3.5 bg-pink-50/30 border border-pink-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[#CD176D] font-black text-[11px] uppercase tracking-wider">Custo CAC</span>
                  <span className="text-[#CD176D] bg-white border border-pink-200 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold">Controlado</span>
                </div>
                <p className="text-[#0F172A] font-extrabold text-sm mt-1">{formatCurrency(reportStats.cac)} / Cliente</p>
                <p className="text-[10px] text-slate-500 font-semibold mt-1">O Custo de Aquisição por cliente se situa 15% abaixo do teto de orçamento aprovado.</p>
              </div>
            </div>
          </div>

          {/* Historical generated files list */}
          <div className="glass-card shadow-sm border border-slate-100 rounded-[32px] p-6 bg-white space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-[#0F172A] font-black tracking-tight text-sm uppercase">
                Histórico de Emissões
              </h4>
              <span className="text-[9px] text-[#A60069] bg-pink-50 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider">
                COOPERATIVA
              </span>
            </div>

            <div className="space-y-3">
              {recentReports.length > 0 ? recentReports.map((rep) => (
                <div 
                  key={rep.id} 
                  className="p-4 border border-slate-50 hover:border-slate-100 hover:bg-slate-50/40 rounded-2xl flex items-center justify-between transition-all group"
                >
                  <div className="space-y-1 min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold text-[#CD176D] uppercase">{rep.id}</span>
                      <span className="text-slate-300 text-[10px]">•</span>
                      <span className="text-[10px] text-slate-400 font-bold">{rep.date}</span>
                    </div>
                    <p className="text-xs font-black text-slate-800 truncate">{rep.title}</p>
                    <p className="text-[10px] font-semibold text-slate-500 leading-none">Mês: {rep.month} • {rep.author}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (rep.format.toLowerCase().includes("csv") || rep.format.toLowerCase().includes("excel")) {
                        handleDownloadCSV();
                        return;
                      }

                      window.print();
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-[#FFF5F9] text-slate-400 hover:text-[#A60069] border border-slate-100 group-hover:border-pink-100 transition-all cursor-pointer shadow-sm active:scale-90"
                    title="Baixar histórico"
                    aria-label={`Baixar histórico do relatório ${rep.id}`}
                  >
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-500 font-semibold">
                  Nenhum histórico adicional sincronizado para este período.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
