import { useState } from "react";
import { useSearchParams } from "react-router";
import { useMonthlyDashboard } from "../hooks/useMonthlyDashboard";
import { 
  Users, 
  Target, 
  BarChart2, 
  DollarSign, 
  UserCheck, 
  Star, 
  Zap, 
  Phone, 
  HelpCircle,
  TrendingUp,
  ChevronDown,
  Clock,
  Eye,
  MousePointer,
  Calendar,
  Layers
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const selectedMonth = searchParams.get("month") || "Maio/2026";
  const currentTab = (searchParams.get("tab") || "Geral") as "Geral" | "Marketing" | "Crescimento";
  const [darkCardTab, setDarkCardTab] = useState<"Funil" | "NPS" | "Evolução">("Funil");
  const [middleCardTab, setMiddleCardTab] = useState<"Funil" | "Planos" | "Evolução">("Funil");
  const [investFilterTab, setInvestFilterTab] = useState<"Todos" | "Marketing" | "Ads" | "Offline" | "Ferramentas">("Todos");
  const { data: dashboardData, loading } = useMonthlyDashboard(selectedMonth);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { summary } = dashboardData;
  const weeklyAdDataGoogle = dashboardData.funnelData.map((item) => ({
    day: item.stage,
    value: item.count,
  }));
  const weeklyAdDataMeta = dashboardData.npsData.map((item) => ({
    day: item.date,
    value: item.score,
  }));
  const weeklyAdDataInsta = dashboardData.beneficiariesData.evolution.map((item) => ({
    day: item.date,
    value: item.count,
  }));
  const investmentList = dashboardData.investments.map((item) => ({
    month: selectedMonth,
    type: item.category === "Software" ? "Ferramentas" : item.category,
    label: item.source,
    value: item.value,
    color: item.category === "Ads" ? "#A60069" : item.category === "Marketing" ? "#8B5CF6" : item.category === "Software" ? "#06B6D4" : "#EAB308",
  }));
  const leadsOriginData = dashboardData.beneficiariesData.distribution.map((item) => ({
    name: item.plan,
    value: item.count,
    color: item.plan === "Premium" ? "#A60069" : item.plan === "Standard" ? "#FF637E" : "#BF9CFF",
  }));
  const cityRankingData = dashboardData.beneficiariesData.evolution.slice(-5).map((item, index, arr) => {
    const previous = index > 0 ? arr[index - 1].count : item.count;
    const variation = previous === 0 ? 0 : Number((((item.count - previous) / previous) * 100).toFixed(1));
    return {
      name: item.date,
      value: item.count.toLocaleString("pt-BR"),
      variation: `${variation >= 0 ? "+" : ""}${variation}%`,
      isPositive: variation >= 0,
    };
  });
  const pfCount = Math.round(summary.beneficiaries.current * 0.59);
  const pjCount = summary.beneficiaries.current - pfCount;

  // Filtered investments based on pill select
  const filteredInvestments = investmentList.filter(item => {
    if (investFilterTab === "Todos") return true;
    if (investFilterTab === "Ads") return item.type === "Ads";
    if (investFilterTab === "Marketing") return item.type === "Marketing";
    if (investFilterTab === "Offline") return item.type === "Offline";
    if (investFilterTab === "Ferramentas") return item.type === "Ferramentas";
    return true;
  });

  // Decide weekly data based on darkCardTab
  const getWeeklyData = () => {
    switch (darkCardTab) {
      case "NPS": return weeklyAdDataMeta;
      case "Evolução": return weeklyAdDataInsta;
      case "Funil": default: return weeklyAdDataGoogle;
    }
  };

  const getSubMetrics = () => {
    if (darkCardTab === "NPS") {
      return {
        views: String(summary.nps.current),
        camp: String(dashboardData.npsData.length),
        invested: summary.cac.current.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        leads: String(summary.nps.current),
        conv: String(summary.sales.current),
        txAgend: `${summary.nps.current}%`
      };
    }

    if (darkCardTab === "Evolução") {
      return {
        views: String(summary.beneficiaries.current),
        camp: String(dashboardData.beneficiariesData.evolution.length),
        invested: summary.investment.current.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        leads: String(summary.beneficiaries.current),
        conv: String(summary.additions.current),
        txAgend: `${((summary.sales.current / Math.max(summary.leads.current, 1)) * 100).toFixed(1)}%`
      };
    }

    return {
      views: String(summary.leads.current),
      camp: String(dashboardData.funnelData.length),
      invested: summary.investment.current.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      leads: String(summary.leads.current),
      conv: String(summary.sales.current),
      txAgend: `${((summary.appointments.current / Math.max(summary.leads.current, 1)) * 100).toFixed(1)}%`
    };
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val);
  };

  const subMetrics = getSubMetrics();

  return (
    <div className="h-auto lg:h-full lg:min-h-0 flex flex-col justify-between select-none pb-12 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        
        {/* Left Side Group (KPIs and charts) */}
        <div className="lg:col-span-9 flex flex-col gap-4 lg:gap-5 h-auto lg:h-full lg:min-h-0 justify-between">
          
          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch shrink-0 mb-6">
            
            {/* Card 1: Total Beneficiarios */}
            <div id="kpi-beneficiarios" className="glass-card shadow-sm p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-full">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A60069]">Total de Beneficiários</span>
                  <div className="flex items-center gap-1">
                    <span className="bg-pink/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded cursor-default flex items-center gap-0.5 select-none">
                      Parcial <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                    <HelpCircle className="w-3 h-3 text-text-secondary cursor-pointer" />
                  </div>
                </div>
                <div className="flex items-baseline mt-1 gap-1.5">
                  <span className="text-2xl font-black text-text-primary tracking-tight whitespace-nowrap">{summary.beneficiaries.current.toLocaleString("pt-BR")}</span>
                  <span className="text-[10px] font-bold text-success flex items-center whitespace-nowrap">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +0,0%
                  </span>
                  <span className="text-[9px] text-text-secondary whitespace-nowrap">vs. anterior</span>
                </div>

                <div className="mt-2 space-y-0.5 text-xs border-t border-border pt-1.5 text-text-secondary leading-tight">
                  <div className="flex justify-between text-[11px]">
                    <span>Total de ativos</span>
                    <span className="font-semibold text-text-primary">{summary.beneficiaries.current.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Novos do mês</span>
                    <span className="font-semibold text-text-primary">{summary.additions.current.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Cancelamentos</span>
                    <span className="font-semibold text-text-primary text-danger">{summary.cancellations.current.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              {/* Bottom circular progress bar / pie-chart */}
              <div className="flex items-center gap-3 mt-1.5 border-t border-border pt-1.5">
                <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="transparent" stroke="#E2E8F0" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="transparent"
                      stroke="#A60069"
                      strokeWidth="3"
                      strokeDasharray={2 * Math.PI * 15}
                      strokeDashoffset={2 * Math.PI * 15 * (1 - 0.59)}
                    />
                  </svg>
                  <span className="absolute text-[9px] font-extrabold text-[#A60069] select-none">59%</span>
                </div>
                <div className="text-[10px] flex-1 space-y-0.5 leading-none">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold text-text-primary whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A60069]"></span> PF 59%
                    </span>
                    <span className="text-text-secondary text-[9px]">({pfCount.toLocaleString("pt-BR")})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold text-text-primary whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF637E]"></span> PJ 41%
                    </span>
                    <span className="text-text-secondary text-[9px]">({pjCount.toLocaleString("pt-BR")})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Investment */}
            <div id="kpi-investimento" className="glass-card shadow-sm p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-full">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A60069]">Investimento</span>
                  <HelpCircle className="w-3 h-3 text-text-secondary cursor-pointer" />
                </div>
                <div className="flex items-baseline mt-1 gap-1.5">
                  <span className="text-2xl font-black text-[#A60069] tracking-tight whitespace-nowrap">{formatBRL(summary.investment.current)}</span>
                  <span className="text-[10px] font-bold text-success flex items-center whitespace-nowrap">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +0,0%
                  </span>
                  <span className="text-[9px] text-text-secondary whitespace-nowrap">vs. anterior</span>
                </div>

                <div className="mt-2 space-y-0.5 text-xs border-t border-border pt-1.5 text-text-secondary leading-tight">
                  <div className="flex justify-between text-[11px]">
                    <span>Investido no mês</span>
                    <span className="font-semibold text-text-primary whitespace-nowrap">{formatBRL(summary.investment.current)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Orçado para o mês</span>
                    <span className="font-semibold text-text-primary whitespace-nowrap">{formatBRL(summary.investment.target || summary.investment.current)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t border-border pt-1.5">
                <div className="flex justify-between text-[10px] text-text-secondary mb-1 font-medium leading-none">
                  <span>% utilizado</span>
                  <span className="font-bold text-[#A60069]">107,8%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#A60069] h-full rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>

            {/* Card 3: Return ROI */}
            <div id="kpi-roi" className="glass-card shadow-sm p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-full">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A60069]">Retorno (ROI)</span>
                  <HelpCircle className="w-3 h-3 text-text-secondary cursor-pointer" />
                </div>
                <div className="flex items-baseline mt-1 gap-1.5">
                  <span className="text-2xl font-black text-text-primary tracking-tight whitespace-nowrap">{(summary.roi.current / 100).toFixed(1)}x</span>
                  <span className="text-[10px] font-bold text-success flex items-center whitespace-nowrap">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +0,3x
                  </span>
                  <span className="text-[9px] text-text-secondary whitespace-nowrap">vs. anterior</span>
                </div>

                <div className="mt-2 space-y-0.5 text-xs border-t border-border pt-1.5 text-text-secondary leading-tight">
                  <div className="flex justify-between text-[11px]">
                    <span>CAC do período</span>
                    <span className="font-semibold text-text-primary">{formatBRL(summary.cac.current)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>LTV Estimado</span>
                    <span className="font-semibold text-text-primary">{formatBRL(summary.leads.current * 2.83)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Fator LTV/CAC</span>
                    <span className="font-semibold text-text-primary">{(summary.roi.current / 100).toFixed(1)}x</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t border-border pt-1.5">
                <div className="flex justify-between text-[10px] text-text-secondary mb-1 font-medium leading-none">
                  <span>Eficiência de ROI</span>
                  <span className="font-bold text-text-primary">31%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-pink-soft h-full rounded-full" style={{ width: "31%" }}></div>
                </div>
              </div>
            </div>

            {/* Card 4: Satisfaction NPS */}
            <div id="kpi-nps" className="glass-card shadow-sm p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-full">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A60069]">Satisfação (NPS)</span>
                  <HelpCircle className="w-3 h-3 text-text-secondary cursor-pointer" />
                </div>
                <div className="flex items-baseline mt-1 gap-1.5">
                  <span className="text-2xl font-black text-text-primary tracking-tight whitespace-nowrap">{summary.nps.current}</span>
                  <span className="text-[10px] font-bold text-success flex items-center whitespace-nowrap">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +2 pts
                  </span>
                  <span className="text-[9px] text-text-secondary whitespace-nowrap">vs. anterior</span>
                </div>

                <div className="mt-2 space-y-0.5 text-xs border-t border-border pt-1.5 text-text-secondary leading-tight">
                  <div className="flex justify-between text-[11px]">
                    <span>Classificação</span>
                    <span className="font-bold text-success">Excelência</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Total de respostas</span>
                    <span className="font-semibold text-text-primary">{summary.leads.current}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Detratores / Promotores</span>
                    <span className="font-semibold text-text-primary">4% / {summary.nps.current}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t border-border pt-1.5">
                <div className="flex justify-between text-[10px] text-text-secondary mb-1 font-medium leading-none">
                  <span>Taxa de Promotores</span>
                  <span className="font-bold text-text-primary">{summary.nps.current}%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#A60069] h-full rounded-full" style={{ width: "78%" }}></div>
                </div>
              </div>
            </div>

          </div>

          {/* Main Charts & Demographics Grid - sharing the bottom part of the 9-column Left section */}
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-3 h-auto lg:flex-1 lg:min-h-0 mt-1 lg:mt-2">
            
            {/* 1. Left Dark Card - Indicadores Reais (Grid Column Span 5) */}
            <div id="ads-performance-card" className="bg-[#0B010C] rounded-2xl shadow-xl flex flex-col p-4 text-white border border-[#2b0c2e] lg:col-span-5 h-auto lg:h-full lg:min-h-0 justify-between gap-4 lg:gap-0">
              
              <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                <div>
                  <h3 className="font-extrabold text-sm text-[#FF637E] leading-tight">Indicadores Reais do Mês</h3>
                  <p className="text-[10px] text-white/50 mt-0.5 leading-tight">Dados sincronizados do Firestore para o mês selecionado</p>
                </div>
                
                <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10 shrink-0">
                {(["Funil", "NPS", "Evolução"] as const).map((subtab) => (
                    <button
                      key={subtab}
                      onClick={() => setDarkCardTab(subtab)}
                      className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${
                        darkCardTab === subtab 
                          ? "bg-[#A60069] text-white shadow" 
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {subtab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recharts Column Chart Styled Fat Rounded Hot-Pink Bars */}
              <div className="h-[140px] lg:h-[115px] lg:flex-1 w-full min-h-[110px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getWeeklyData()} margin={{ top: 5, right: 5, left: -35, bottom: -5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.5)" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1c0b1e", borderColor: "#411445", color: "white", borderRadius: "8px", fontSize: "10px" }} 
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    <Bar dataKey="value" stroke="none" radius={[4, 4, 0, 0]} maxBarSize={18}>
                      {getWeeklyData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 4 || index === 2 ? "#FF637E" : "#A60069"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Submetrics Grid Inside Left Dark Card */}
              <div className="grid grid-cols-3 gap-1.5 mt-3 shrink-0">
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">Visualizações</span>
                  <span className="text-sm font-extrabold mt-1 text-white leading-none">{subMetrics.views}</span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">Campanhas</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold mt-1 text-white leading-none">{subMetrics.camp}</span>
                    <span className="text-[8px] text-white/40 leading-none">- 0</span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">Investido</span>
                  <span className="text-sm font-extrabold mt-1 text-white leading-none">{subMetrics.invested}</span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between max-h-[46px]">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">Leads</span>
                  <span className="text-sm font-extrabold mt-1 text-[#FF637E] leading-none">{subMetrics.leads}</span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between max-h-[46px]">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">Conversões</span>
                  <span className="text-sm font-extrabold mt-1 text-white leading-none">{subMetrics.conv}</span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between max-h-[46px]">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">Tx. Agendamento</span>
                  <span className="text-sm font-extrabold mt-1 text-white leading-none">{subMetrics.txAgend}</span>
                </div>
              </div>
              <p className="text-[8px] text-white/30 text-right mt-1.5 shrink-0">Fonte: Envio de Dados ({selectedMonth})</p>
            </div>

            {/* 2. Middle Column: Conversão & Funil / Demografias (Grid Column Span 4) */}
            <div id="middle-tabs-card" className="glass-card shadow-sm p-4 flex flex-col lg:col-span-4 h-auto lg:h-full lg:min-h-0 justify-between gap-4 lg:gap-0 min-h-[260px] sm:min-h-[300px] lg:min-h-0">
              
              <div className="flex items-center gap-1 border-b border-border pb-2 mb-2 overflow-x-auto whitespace-nowrap shrink-0">
                {[ 
                  { id: "Funil", label: "Funil de Conversão" },
                  { id: "Planos", label: "Distribuição por Plano" },
                  { id: "Evolução", label: "Evolução Mensal" }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMiddleCardTab(tab.id as any)}
                    className={`px-3 py-1 text-[11px] font-extrabold rounded-lg transition-all ${
                      middleCardTab === tab.id
                        ? "bg-[#A60069] text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex flex-col justify-center min-h-[200px] lg:min-h-0">
                {middleCardTab === "Funil" && (
                  <div className="grid grid-cols-[110px_1fr_95px] items-center gap-1 h-full min-h-0">
                    {/* Visual Left KPI list */}
                    <div className="space-y-2.5 py-1">
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">Impressões</span>
                        <span className="text-xs font-black text-text-primary leading-none">490.611,1</span>
                        <span className="text-[8px] text-text-secondary block leading-none mt-0.5">~ 0,0%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">Cliques</span>
                        <span className="text-xs font-black text-text-primary leading-none">34.342,777</span>
                        <span className="text-[8px] text-text-secondary block leading-none mt-0.5">~ 0,0%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">Leads</span>
                        <span className="text-xs font-black text-text-primary leading-none">145</span>
                        <span className="text-[8px] text-success font-bold block leading-none mt-0.5">↑ 9,8%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">Agendamentos</span>
                        <span className="text-xs font-black text-text-primary leading-none">21</span>
                        <span className="text-[8px] text-success font-bold block leading-none mt-0.5">↑ 23,5%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">Vendas</span>
                        <span className="text-xs font-black text-text-primary leading-none">18</span>
                        <span className="text-[8px] text-success font-bold block leading-none mt-0.5">↑ 20,0%</span>
                      </div>
                    </div>

                    {/* Layered Slices Visual representation */}
                    <div className="flex flex-col items-center justify-around h-full py-1.5 gap-1.5 shrink-0 min-h-0">
                      <div className="w-[100%] h-6 bg-[#A60069]/5 border border-[#A60069]/20 rounded flex items-center justify-center p-0.5 relative">
                        <Eye className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="w-[85%] h-6 bg-[#A60069]/10 border border-[#A60069]/30 rounded flex items-center justify-center p-0.5 relative">
                        <MousePointer className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="w-[70%] h-6 bg-[#FF637E]/20 rounded flex items-center justify-center p-0.5 relative">
                        <Users className="w-3.5 h-3.5 text-[#A60069]" />
                      </div>
                      <div className="w-[55%] h-6 bg-[#FF637E]/40 rounded flex items-center justify-center p-0.5 relative">
                        <Calendar className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="w-[40%] h-6 bg-[#A60069] rounded flex items-center justify-center p-0.5 relative shadow-sm">
                        <UserCheck className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    {/* Right side conversions */}
                    <div className="space-y-4 text-right pl-2 border-l border-border shrink-0 py-1">
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block leading-none">CTR (Clicks)</span>
                        <span className="text-[11px] font-bold text-text-primary leading-none block mt-0.5">7,00%</span>
                        <span className="text-[8px] text-success font-bold block mt-0.5">↑ 0,2%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block leading-none">Conv. Leads</span>
                        <span className="text-[11px] font-bold text-text-primary leading-none block mt-0.5">0,42%</span>
                        <span className="text-[8px] text-success font-bold block mt-0.5">↑ 0,1%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block leading-none">Tx. Agend.</span>
                        <span className="text-[11px] font-bold text-text-primary leading-none block mt-0.5">14,48%</span>
                        <span className="text-[8px] text-success font-bold block mt-0.5">↑ 1,2%</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block leading-none">Aprov. Com.</span>
                        <span className="text-[11px] font-bold text-text-primary leading-none block mt-0.5">85,71%</span>
                        <span className="text-[8px] text-success font-bold block mt-0.5">↑ 0,5%</span>
                      </div>
                    </div>
                  </div>
                )}

                {middleCardTab === "Planos" && (
                  <div className="flex flex-col items-center justify-center h-auto lg:h-full py-2">
                    <span className="text-[10px] text-text-secondary font-bold mb-1">Distribuição por Plano</span>
                    <div className="h-[105px] w-full relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={105}>
                        <PieChart>
                          <Pie
                            data={leadsOriginData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={55}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {leadsOriginData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center leading-none">
                        <span className="text-lg font-black text-text-primary">1.070</span>
                        <p className="text-[8px] text-text-secondary font-semibold mt-0.5">Beneficiários</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 w-full mt-2 text-[10px] font-bold text-text-secondary px-2">
                      {leadsOriginData.map((channel, i) => (
                        <div key={i} className="flex items-center gap-1 truncate">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: channel.color }}></span>
                          <span className="truncate">{channel.name} ({channel.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {middleCardTab === "Evolução" && (
                  <div className="space-y-1.5 h-full flex flex-col justify-center">
                    <div className="flex justify-between items-center text-[9px] font-bold text-text-secondary pb-1 border-b border-border">
                      <span>Mês</span>
                      <span>Beneficiários Ativos</span>
                    </div>
                    {cityRankingData.map((city, index) => (
                      <div key={index} className="flex justify-between items-center text-[11px] py-1 border-b border-border last:border-b-0 leading-tight">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 text-text-secondary font-bold text-[9px]">0{index + 1}</span>
                          <span className="text-text-primary font-semibold">{city.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-text-primary">{city.value}</span>
                          <span className={`text-[9px] font-bold ${city.isPositive ? "text-success" : "text-danger"}`}>
                            {city.variation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: 3 columns of space exclusively for Investimentos do Mês */}
        <div className="lg:col-span-3 h-auto lg:h-full lg:min-h-0 flex flex-col mt-4 lg:mt-0">
          <div id="investments-month-card" className="glass-card shadow-sm p-4 flex flex-col justify-between h-auto lg:h-full lg:min-h-0 select-none min-h-[280px] sm:min-h-[320px] lg:min-h-0">
            <div className="flex flex-col h-full min-h-0 justify-between">
              
              {/* Header section identical style to image */}
              <div className="flex items-baseline justify-between gap-1.5 shrink-0 pb-1.5">
                <h3 className="font-extrabold text-text-primary text-xs flex items-center gap-1 leading-none">
                  <BarChart2 className="w-3.5 h-3.5 text-[#A60069]" /> Investimentos do Mês
                </h3>
                <div className="text-right leading-none">
                  <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">TOTAL</p>
                  <p className="text-sm lg:text-base font-black text-[#A60069] mt-0.5 block whitespace-nowrap">R$ 14.017,46</p>
                </div>
              </div>

              {/* Sub Filter pills style with thin outline */}
              <div className="flex items-center gap-1 flex-wrap pb-2 mb-1 border-b border-border shrink-0">
                {(["Todos", "Marketing", "Ads", "Offline", "Ferramentas"] as const).map((filterPill) => (
                  <button
                    key={filterPill}
                    onClick={() => setInvestFilterTab(filterPill)}
                    className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all border ${
                      investFilterTab === filterPill
                        ? "bg-[#A60069] border-[#A60069] text-white shadow-sm"
                        : "bg-white border-border text-text-secondary hover:bg-slate-50 relative"
                    }`}
                  >
                    {filterPill}
                  </button>
                ))}
              </div>

              {/* List Table Scrollable */}
              <div className="flex-1 min-h-[180px] lg:min-h-0 flex flex-col">
                <div className="grid grid-cols-[65px_1fr_60px] items-center text-[9px] font-bold text-[#64748B] border-b border-border pb-1 leading-none shrink-0 mb-1.5">
                  <span>Mês</span>
                  <span>Métrica</span>
                  <span className="text-right">Valor</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 scrollbar-thin">
                  {filteredInvestments.map((item, index) => (
                    <div key={index} className="grid grid-cols-[65px_1fr_60px] items-center text-[10px] py-1 border-b border-border last:border-b-0 leading-tight">
                      <span className="text-[#64748B] font-medium">{item.month}</span>
                      <div className="flex items-center gap-1 truncate pr-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-text-primary font-semibold truncate" title={item.label}>
                          {item.label}
                        </span>
                      </div>
                      <span className="font-extrabold text-text-primary text-right whitespace-nowrap font-mono">
                        R$ {formatBRL(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer last update */}
              <div className="flex items-center gap-1 text-[8px] text-[#64748B] font-bold border-t border-border pt-2 mt-2 shrink-0 leading-none">
                <Clock className="w-3 h-3 text-[#A60069]" />
                <span>Última atualização: 05/05/2026 08:30</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
