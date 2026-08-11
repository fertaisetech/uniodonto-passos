import { useState } from "react";
import { useSearchParams } from "react-router";
import { useMonthlyDashboard } from "../hooks/useMonthlyDashboard";
import {
  getCurrentMonthKey,
  getPeriodLabel,
  loadLocalMonthlyDashboard,
  calculateMetaAdsMetrics,
  buildMarketingFunnelData,
} from "../lib/dashboardData";
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
  Layers,
  XCircle,
  Info,
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
  Pie,
} from "recharts";
import { finiteNumber } from "../lib/chartUtils";

const formatDashboardNumber = (value: number) =>
  finiteNumber(value).toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
  });

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const selectedMonth = searchParams.get("month") || getCurrentMonthKey();
  const currentTab = (searchParams.get("tab") || "Geral") as
    "Geral" | "Marketing" | "Crescimento";
  const [darkCardTab, setDarkCardTab] = useState<"Meta" | "Google" | "Offline">(
    "Meta",
  );
  const [summaryPeriod, setSummaryPeriod] = useState<"current" | "all">(
    "current",
  );
  const [middleCardTab, setMiddleCardTab] = useState<
    "Funil" | "Planos" | "Evolução"
  >(
    (searchParams.get("middle") as "Funil" | "Planos" | "Evolução") ||
      "Evolução",
  );
  const [investFilterTab, setInvestFilterTab] = useState<
    "Todos" | "Marketing" | "Ads" | "Offline" | "Ferramentas"
  >("Todos");
  const {
    data: dashboardData,
    loading,
    hasData,
    isDefaultData,
    error,
  } = useMonthlyDashboard(selectedMonth);
  const periodLabel = getPeriodLabel(selectedMonth);

  if (loading || !dashboardData) {
    if (
      !loading &&
      (!dashboardData || (selectedMonth === "Todos" && !hasData))
    ) {
      return (
        <div className="flex h-full min-h-[300px] items-center justify-center p-6 text-center text-sm font-bold text-slate-500">
          Dados indisponíveis para o período
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { summary } = dashboardData;
  const investmentTarget =
    Number(summary.investment.target) ||
    Number(summary.investment.current) ||
    0;
  const investmentUtilization =
    investmentTarget > 0
      ? (Number(summary.investment.current) / investmentTarget) * 100
      : 0;
  const roiFactor = Number(summary.roi.current) / 100;
  const roiEfficiency = Math.max(0, Math.min(100, roiFactor * 25));
  const ltvEstimated = (Number(summary.cac.current) || 0) * roiFactor;
  const npsVariation = Number(summary.nps.variation) || 0;
  const npsClassification =
    summary.nps.current >= 75
      ? "Excelência"
      : summary.nps.current >= 50
        ? "Muito bom"
        : summary.nps.current >= 0
          ? "Atenção"
          : "Crítico";
  const operationalData = dashboardData.operationalData;
  const evolutionEntries = operationalData?.entries ?? 0;
  const evolutionCancellations = operationalData?.cancellations ?? 0;
  const evolutionBalance = evolutionEntries - evolutionCancellations;
  const operationalEntryCategories: readonly (readonly [string, number, string])[] = operationalData
    ? operationalData.entriesByCity
        .slice()
        .sort((a, b) => b.entries - a.entries)
        .map((item, index) => [
          `${item.partial ? "≥ " : ""}${item.cityName}`,
          item.entries,
          ["#087F5B", "#20A878", "#73D3AE", "#A7E5CB", "#BFEEDB", "#DDF5EA"][index] || "#DDF5EA",
        ] as const)
    : [];
  const operationalCancellationCategories: readonly (readonly [string, number, string])[] = operationalData
    ? operationalData.cancellationReasons
        .slice()
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 7)
        .map((item, index) => [
          item.reasonOriginal,
          item.quantity,
          ["#B80046", "#F23B68", "#F77991", "#F9A9B7", "#FBD0D8", "#FDE3E7", "#FDECEF"][index] || "#FDECEF",
        ] as const)
    : [];
  const monthIndex = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ].findIndex((name) => selectedMonth.startsWith(name));
  const periodRecords =
    summaryPeriod === "all"
      ? Array.from({ length: Math.max(1, monthIndex + 1) }, (_, index) => {
          const month = `${["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][index]}/${selectedMonth.split("/")[1] || "2026"}`;
          return loadLocalMonthlyDashboard(month);
        }).filter((record): record is NonNullable<typeof record> => Boolean(record))
      : [dashboardData];
  if (summaryPeriod === "all" && periodRecords.length === 0) {
    periodRecords.push(dashboardData);
  }
  const periodSummary = periodRecords.reduce(
    (acc, record) => ({
      ...acc,
      beneficiaries: { ...acc.beneficiaries, current: record.summary.beneficiaries.current },
      additions: { ...acc.additions, current: acc.additions.current + record.summary.additions.current },
      cancellations: { ...acc.cancellations, current: acc.cancellations.current + record.summary.cancellations.current },
      investment: { ...acc.investment, current: acc.investment.current + record.summary.investment.current },
      leads: { ...acc.leads, current: acc.leads.current + record.summary.leads.current },
      appointments: { ...acc.appointments, current: acc.appointments.current + record.summary.appointments.current },
      sales: { ...acc.sales, current: acc.sales.current + record.summary.sales.current },
      nps: { ...acc.nps, current: record.summary.nps.current },
    }),
    {
      ...summary,
      additions: { ...summary.additions, current: 0 },
      cancellations: { ...summary.cancellations, current: 0 },
      investment: { ...summary.investment, current: 0 },
      leads: { ...summary.leads, current: 0 },
      appointments: { ...summary.appointments, current: 0 },
      sales: { ...summary.sales, current: 0 },
    },
  );
  if (summaryPeriod === "all") {
    periodSummary.cac.current = periodSummary.investment.current / Math.max(1, periodSummary.sales.current);
    periodSummary.roi.current = periodSummary.investment.current > 0
      ? (periodSummary.sales.current / periodSummary.investment.current) * 100
      : 0;
  }
  const periodInvestments = periodRecords.flatMap(
    (record) => record.investments || [],
  );
  const periodMetrics = periodRecords.flatMap((record) => record.metrics || []);
  const metaAdsCampaigns = (dashboardData.metaAdsCampaigns || [])
    .filter((campaign) => campaign.active && campaign.channel === "Meta")
    .filter((campaign) => summaryPeriod === "all" || campaign.competence === selectedMonth);
  const metaAdsTotals = metaAdsCampaigns.reduce(
    (totals, campaign) => ({
      investment: totals.investment + (Number(campaign.investment) || 0),
      impressions: totals.impressions + (Number(campaign.impressions) || 0),
      reach: totals.reach + (Number(campaign.reach) || 0),
      linkClicks: totals.linkClicks + (Number(campaign.linkClicks) || 0),
      leads: totals.leads + (Number(campaign.leads) || 0),
      pageViews:
        totals.pageViews === null && campaign.pageViews === null
          ? null
          : (totals.pageViews || 0) + (Number(campaign.pageViews) || 0),
    }),
    { investment: 0, impressions: 0, reach: 0, linkClicks: 0, leads: 0, pageViews: null as number | null },
  );
  const metaAdsMetrics = calculateMetaAdsMetrics(metaAdsTotals);
  const hasMetaAdsData = metaAdsCampaigns.length > 0;
  const metaAdsIsActual = hasMetaAdsData && metaAdsCampaigns.every((campaign) => campaign.dataMode === "actual");
  const formatMetaValue = (value: number | null, suffix = "") =>
    value === null || !Number.isFinite(value)
      ? "Não calculável"
      : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${suffix}`;
  const totalPeriodInvestment = periodInvestments
    .filter((item) => item.checked)
    .reduce((total, item) => total + (Number(item.value) || 0), 0);
  const weeklyAdDataGoogle = dashboardData.funnelData.map((item) => ({
    day: item.stage,
    value: item.count,
  }));
  const weeklyAdDataMeta = dashboardData.npsData.map((item) => ({
    day: item.date,
    value: item.score,
  }));
  const weeklyAdDataInsta = dashboardData.beneficiariesData.evolution.map(
    (item) => ({
      day: item.date,
      value: item.count,
    }),
  );
  const investmentList = periodInvestments
    .filter((item) => item.checked)
    .map((item) => ({
      month: selectedMonth,
      type: item.category === "Software" ? "Ferramentas" : item.category,
      label: item.source,
      value: item.value,
      color:
        item.category === "Ads"
          ? "#A60069"
          : item.category === "Marketing"
            ? "#8B5CF6"
            : item.category === "Software"
              ? "#06B6D4"
              : "#EAB308",
    }));
  const channelChartData = [
    {
      label: "Meta",
      color: "#D62976",
      data: investmentList
        .filter((item) => /meta|facebook|instagram/i.test(item.label))
        .map((item) => ({
          name: item.label.replace(/Meta \(|\)/gi, "").slice(0, 12),
          value: item.value,
        })),
    },
    {
      label: "Google",
      color: "#4285F4",
      data: investmentList
        .filter((item) => /google/i.test(item.label))
        .map((item) => ({
          name: item.label.replace(/Google Ads/gi, "Google").slice(0, 12),
          value: item.value,
        })),
    },
    {
      label: "Mídia Offline",
      color: "#EAB308",
      data: investmentList
        .filter((item) => item.type === "Offline")
        .map((item) => ({ name: item.label.slice(0, 12), value: item.value })),
    },
  ];
  const cityDistribution = operationalData
    ? operationalData.entriesByCity
        .slice()
        .sort((a, b) =>
          b.entries - a.entries || a.cityName.localeCompare(b.cityName, "pt-BR"),
        )
        .map((city) => ({
          plan: city.cityName,
          count: city.entries,
          partial: city.partial,
        }))
    : [];
  const cityTotal = operationalData?.entries ?? 0;
  const cityMovement = operationalData
    ? operationalData.entriesByCity
        .slice()
        .sort((a, b) =>
          b.entries - a.entries || a.cityName.localeCompare(b.cityName, "pt-BR"),
        )
        .map((city) => ({
          plan: city.cityName,
          entries: city.entries,
          cancellations: city.cancellations,
          partial: city.partial,
        }))
    : [];
  const cityLeader = cityDistribution.find((city) => city.count > 0);
  const cityConcentration = cityLeader && cityTotal > 0
    ? (cityLeader.count / cityTotal) * 100
    : 0;
  const cityReconciliation = operationalData
    ? {
        entries: operationalData.entriesByCity.reduce((sum, city) => sum + city.entries, 0),
        cancellations: operationalData.entriesByCity.reduce((sum, city) => sum + city.cancellations, 0),
      }
    : null;
  const cityDataConsistent = Boolean(
    operationalData &&
      cityReconciliation &&
      cityReconciliation.entries === operationalData.entries &&
      cityReconciliation.cancellations === operationalData.cancellations,
  );
  const cityMonthName = selectedMonth.split("/")[0] || "mês";
  const cityIsPartial = operationalData?.status === "partial";
  const formatCityCount = (value: number, partial = false) =>
    `${partial ? "≥ " : ""}${Math.trunc(Number(value) || 0).toLocaleString("pt-BR")}`;
  const formatCityBalance = (value: number, partial = false) => {
    const safeValue = Math.trunc(Number(value) || 0);
    return `${partial ? "≥ " : ""}${safeValue > 0 ? "+" : ""}${safeValue.toLocaleString("pt-BR")}`;
  };
  const leadsOriginData = cityDistribution.map((item) => ({
    name: item.plan,
    value: item.count,
    color: "#BF9CFF",
  }));
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const selectedYear = Number(
    selectedMonth.split("/")[1] || new Date().getFullYear(),
  );
  const selectedMonthNumber =
    monthNames.findIndex((name) => selectedMonth.startsWith(name)) + 1;
  const supplementalEvolution = [selectedMonthNumber - 1, selectedMonthNumber]
    .filter((number) => number > 0)
    .flatMap((number) => {
      const monthKey = `${monthNames[number - 1]}/${selectedYear}`;
      const record = loadLocalMonthlyDashboard(monthKey);
      if (!record && monthKey !== selectedMonth) return [];
      return [{
        date: `${selectedYear}-${String(number).padStart(2, "0")}`,
          count:
            monthKey === selectedMonth
              ? summary.beneficiaries.current
            : record?.summary.beneficiaries.current || 0,
      }];
    });
  const evolutionRows = [
    ...dashboardData.beneficiariesData.evolution,
    ...supplementalEvolution,
  ]
    .filter(
      (item, index, all) =>
        all.findIndex((candidate) => candidate.date === item.date) === index,
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-5);
  const cityRankingData = evolutionRows.map((item, index, arr) => {
    const previous = index > 0 ? arr[index - 1].count : item.count;
    const variation =
      previous === 0
        ? 0
        : Number((((item.count - previous) / previous) * 100).toFixed(1));
    const [year, monthNumber] = item.date.split("-");
    const monthKey = `${monthNames[Math.max(0, Number(monthNumber) - 1)]}/${year}`;
    const monthRecord = loadLocalMonthlyDashboard(monthKey);
    return {
      name: item.date,
      value: item.count.toLocaleString("pt-BR"),
      entries: monthRecord?.summary.additions.current || 0,
      cancellations: monthRecord?.summary.cancellations.current || 0,
      variation: `${variation >= 0 ? "+" : ""}${variation}%`,
      isPositive: variation >= 0,
    };
  });
  const operationalHistory = (() => {
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const records = monthNames
      .map((name) => loadLocalMonthlyDashboard(`${name}/${selectedYear}`))
      .filter((record): record is NonNullable<typeof record> => Boolean(record?.operationalData));
    if (operationalData && !records.some((record) => record.month === dashboardData.month)) {
      records.push(dashboardData);
    }
    return records
      .filter((record) => Boolean(record.operationalData))
      .sort((a, b) => (a.operationalData?.competence || "").localeCompare(b.operationalData?.competence || ""));
  })();
  const pfCount = Math.round(summary.beneficiaries.current * 0.59);
  const pjCount = summary.beneficiaries.current - pfCount;

  // Filtered investments based on pill select
  const filteredInvestments = investmentList.filter((item) => {
    if (investFilterTab === "Todos") return true;
    if (investFilterTab === "Ads") return item.type === "Ads";
    if (investFilterTab === "Marketing") return item.type === "Marketing";
    if (investFilterTab === "Offline") return item.type === "Offline";
    if (investFilterTab === "Ferramentas") return item.type === "Ferramentas";
    return true;
  });

  // Decide weekly data based on darkCardTab
  const channelData = {
    Meta: channelChartData[0].data,
    Google: channelChartData[1].data,
    Offline: channelChartData[2].data,
  };

  const channelInfo = {
    Meta: {
      investment: channelChartData[0].data.reduce(
        (total, item) => total + item.value,
        0,
      ),
      campaigns: periodMetrics.filter(
        (item) => item.checked && /meta/i.test(item.category),
      ).length,
    },
    Google: {
      investment: channelChartData[1].data.reduce(
        (total, item) => total + item.value,
        0,
      ),
      campaigns: periodMetrics.filter(
        (item) => item.checked && /google/i.test(item.category),
      ).length,
    },
    Offline: {
      investment: channelChartData[2].data.reduce(
        (total, item) => total + item.value,
        0,
      ),
      campaigns: channelChartData[2].data.length,
    },
  };

  const marketingFunnel = buildMarketingFunnelData({
    summary: periodSummary,
    metrics: periodMetrics,
    metaAdsCampaigns,
  });
  const impressions = marketingFunnel.impressions;
  const clicks = marketingFunnel.clicks;

  const safeRate = (value: number, denominator: number) =>
    denominator > 0
      ? `${((value / denominator) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`
      : "—";
  const formatUpdatedAt = (value: unknown) => {
    const date = value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
      ? value.toDate()
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : null;
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
      : "Não informado";
  };
  const funnelMetrics = [
    { name: "Impressões", value: impressions, color: "#1877F2" },
    { name: "Cliques", value: clicks, color: "#20A4F3" },
    { name: "Leads", value: marketingFunnel.leads, color: "#18C7B7" },
    { name: "Agendamentos", value: marketingFunnel.appointments, color: "#F4B400" },
    { name: "Vendas", value: marketingFunnel.sales, color: "#E83E72" },
  ];
  const channelInvestment = channelInfo[darkCardTab].investment;
  const channelLeads = funnelMetrics[2].value;
  const channelSales = funnelMetrics[4].value;
  const channelCpl = channelLeads > 0 ? channelInvestment / channelLeads : null;
  const channelCac = channelSales > 0 ? channelInvestment / channelSales : null;
  const channelRoas: number | null = null;
  const salesGoal = Math.max(0, Number(periodSummary.sales.target) || 0);
  const salesProgress = salesGoal > 0 ? (channelSales / salesGoal) * 100 : null;

  const getWeeklyData = () =>
    funnelMetrics.map((item) => ({ name: item.name, value: item.value }));
  const channelAccent =
    darkCardTab === "Meta"
      ? "#1877F2"
      : darkCardTab === "Google"
        ? "#4285F4"
        : "#EAB308";
  const googleBarPalette = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"];

  const getSubMetrics = () => {
    return {
      impressions: impressions.toLocaleString("pt-BR"),
      clicks: clicks.toLocaleString("pt-BR"),
      leads: String(periodSummary.leads.current),
      camp: String(channelInfo[darkCardTab].campaigns),
      invested: channelInfo[darkCardTab].investment.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      conv: String(periodSummary.sales.current),
      txAgend: `${((periodSummary.appointments.current / Math.max(periodSummary.leads.current, 1)) * 100).toFixed(1)}%`,
    };
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const subMetrics = getSubMetrics();

  return (
    <div className="h-auto lg:h-full lg:min-h-0 flex flex-col justify-between select-none pb-12 lg:pb-0">
      {error && (
        <div className="mb-3 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
          Dados exibidos localmente. A sincronização remota ainda não foi confirmada.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Left Side Group (KPIs and charts) */}
        <div className="lg:col-span-9 flex flex-col gap-4 lg:gap-5 h-auto lg:h-full lg:min-h-0 justify-between">
          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch shrink-0 mb-6">
            {/* Card 1: Total Beneficiarios */}
            <div
              id="kpi-beneficiarios"
              className="glass-card shadow-sm p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-full"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A60069]">
                    Total de Beneficiários
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="bg-pink/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded cursor-default flex items-center gap-0.5 select-none">
                      Parcial <ChevronDown className="w-2.5 h-2.5" />
                    </span>
                    <HelpCircle className="w-3 h-3 text-text-secondary cursor-pointer" />
                  </div>
                </div>
                <div className="flex items-baseline mt-1 gap-1.5">
                  <span className="text-2xl font-black text-text-primary tracking-tight whitespace-nowrap">
                    {summary.beneficiaries.current.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-[10px] font-bold text-success flex items-center whitespace-nowrap">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +0,0%
                  </span>
                  <span className="text-[9px] text-text-secondary whitespace-nowrap">
                    vs. anterior
                  </span>
                </div>

                <div className="mt-2 space-y-0.5 text-xs border-t border-border pt-1.5 text-text-secondary leading-tight">
                  <div className="flex justify-between text-[11px]">
                    <span>Total de ativos</span>
                    <span className="font-semibold text-text-primary">
                      {summary.beneficiaries.current.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Novos do mês</span>
                    <span className="font-semibold text-text-primary">
                      {summary.additions.current.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Cancelamentos</span>
                    <span className="font-semibold text-text-primary text-danger">
                      {summary.cancellations.current.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom circular progress bar / pie-chart */}
              <div className="flex items-center gap-3 mt-1.5 border-t border-border pt-1.5">
                <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="transparent"
                      stroke="#E2E8F0"
                      strokeWidth="3"
                    />
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
                  <span className="absolute text-[9px] font-extrabold text-[#A60069] select-none">
                    59%
                  </span>
                </div>
                <div className="text-[10px] flex-1 space-y-0.5 leading-none">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold text-text-primary whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A60069]"></span>{" "}
                      PF 59%
                    </span>
                    <span className="text-text-secondary text-[9px]">
                      ({pfCount.toLocaleString("pt-BR")})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold text-text-primary whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF637E]"></span>{" "}
                      PJ 41%
                    </span>
                    <span className="text-text-secondary text-[9px]">
                      ({pjCount.toLocaleString("pt-BR")})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Investment */}
            <div
              id="kpi-investimento"
              className="glass-card shadow-sm p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-full"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A60069]">
                    Investimento
                  </span>
                  <HelpCircle className="w-3 h-3 text-text-secondary cursor-pointer" />
                </div>
                <div className="flex items-baseline mt-1 gap-1.5">
                  <span className="text-2xl font-black text-[#A60069] tracking-tight whitespace-nowrap">
                    {formatBRL(summary.investment.current)}
                  </span>
                  <span className="text-[10px] font-bold text-success flex items-center whitespace-nowrap">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> +0,0%
                  </span>
                  <span className="text-[9px] text-text-secondary whitespace-nowrap">
                    vs. anterior
                  </span>
                </div>

                <div className="mt-2 space-y-0.5 text-xs border-t border-border pt-1.5 text-text-secondary leading-tight">
                  <div className="flex justify-between text-[11px]">
                    <span>Investido no mês</span>
                    <span className="font-semibold text-text-primary whitespace-nowrap">
                      {formatBRL(summary.investment.current)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Orçado para o mês</span>
                    <span className="font-semibold text-text-primary whitespace-nowrap">
                      {formatBRL(
                        summary.investment.target || summary.investment.current,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t border-border pt-1.5">
                <div className="flex justify-between text-[10px] text-text-secondary mb-1 font-medium leading-none">
                  <span>% utilizado</span>
                  <span className="font-bold text-[#A60069]">
                    {investmentUtilization.toFixed(1).replace(".", ",")}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#A60069] h-full rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Card 3: Return ROI */}
            <div
              id="kpi-roi"
              className="glass-card shadow-sm p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-full"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A60069]">
                    Retorno (ROI)
                  </span>
                  <HelpCircle className="w-3 h-3 text-text-secondary cursor-pointer" />
                </div>
                <div className="flex items-baseline mt-1 gap-1.5">
                  <span className="text-2xl font-black text-text-primary tracking-tight whitespace-nowrap">
                    {(summary.roi.current / 100).toFixed(1)}x
                  </span>
                  <span className="text-[10px] font-bold text-success flex items-center whitespace-nowrap">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />{" "}
                    {summary.roi.variation >= 0 ? "+" : ""}
                    {(Number(summary.roi.variation) / 100)
                      .toFixed(1)
                      .replace(".", ",")}
                    x
                  </span>
                  <span className="text-[9px] text-text-secondary whitespace-nowrap">
                    vs. anterior
                  </span>
                </div>

                <div className="mt-2 space-y-0.5 text-xs border-t border-border pt-1.5 text-text-secondary leading-tight">
                  <div className="flex justify-between text-[11px]">
                    <span>CAC do período</span>
                    <span className="font-semibold text-text-primary">
                      {formatBRL(summary.cac.current)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>LTV Estimado</span>
                    <span className="font-semibold text-text-primary">
                      {formatBRL(ltvEstimated)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Fator LTV/CAC</span>
                    <span className="font-semibold text-text-primary">
                      {(summary.roi.current / 100).toFixed(1)}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t border-border pt-1.5">
                <div className="flex justify-between text-[10px] text-text-secondary mb-1 font-medium leading-none">
                  <span>Eficiência de ROI</span>
                  <span className="font-bold text-text-primary">
                    {roiEfficiency.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-pink-soft h-full rounded-full"
                    style={{ width: `${roiEfficiency}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Card 4: Satisfaction NPS */}
            <div
              id="kpi-nps"
              className="glass-card shadow-sm p-4 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] w-full"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#A60069]">
                    Satisfação (NPS)
                  </span>
                  <HelpCircle className="w-3 h-3 text-text-secondary cursor-pointer" />
                </div>
                <div className="flex items-baseline mt-1 gap-1.5">
                  <span className="text-2xl font-black text-text-primary tracking-tight whitespace-nowrap">
                    {summary.nps.current}
                  </span>
                  <span className="text-[10px] font-bold text-success flex items-center whitespace-nowrap">
                    <TrendingUp className="w-2.5 h-2.5 mr-0.5" />{" "}
                    {npsVariation >= 0 ? "+" : ""}
                    {npsVariation} pts
                  </span>
                  <span className="text-[9px] text-text-secondary whitespace-nowrap">
                    vs. anterior
                  </span>
                </div>

                <div className="mt-2 space-y-0.5 text-xs border-t border-border pt-1.5 text-text-secondary leading-tight">
                  <div className="flex justify-between text-[11px]">
                    <span>Classificação</span>
                    <span className="font-bold text-success">
                      {npsClassification}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Total de respostas</span>
                    <span className="font-semibold text-text-primary">
                      {summary.leads.current}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Detratores / Promotores</span>
                    <span className="font-semibold text-text-primary">
                      4% / {summary.nps.current}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 border-t border-border pt-1.5">
                <div className="flex justify-between text-[10px] text-text-secondary mb-1 font-medium leading-none">
                  <span>Taxa de Promotores</span>
                  <span className="font-bold text-text-primary">
                    {summary.nps.current}%
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#A60069] h-full rounded-full"
                    style={{ width: "78%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Charts & Demographics Grid - sharing the bottom part of the 9-column Left section */}
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-3 h-auto lg:flex-1 lg:min-h-0 mt-1 lg:mt-2">
            {/* 1. Left Dark Card - Indicadores Reais (Grid Column Span 5) */}
            <div
              id="ads-performance-card"
              className="bg-[#0B010C] rounded-2xl shadow-xl flex flex-col p-4 text-white border border-[#2b0c2e] lg:col-span-5 h-auto lg:h-full lg:min-h-0 justify-between gap-4 lg:gap-0"
            >
              <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                <div>
                  <h3 className="whitespace-nowrap text-sm font-extrabold leading-none text-[#FF637E]">
                    {darkCardTab === "Meta"
                      ? metaAdsIsActual
                        ? "Desempenho Meta Ads do Mês"
                        : hasMetaAdsData
                          ? "Simulação de Desempenho Meta Ads"
                          : "Meta Ads do Mês"
                      : "Indicadores Reais do Mês"}
                  </h3>
                  <p className="text-[9px] text-white/50 mt-0.5 leading-tight">
                    {darkCardTab === "Meta"
                      ? metaAdsIsActual
                        ? "Dados informados a partir do Meta Ads Manager"
                        : hasMetaAdsData
                          ? "Projeção de investimentos e desempenho de mídia"
                          : "Dados da competência ainda não enviados"
                      : "Resumo de investimentos e resultados de marketing"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                    <button
                      onClick={() => setSummaryPeriod("current")}
                      className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${summaryPeriod === "current" ? "bg-[#A60069] text-white shadow" : "text-white/60 hover:text-white"}`}
                    >
                      Mês atual
                    </button>
                    <button
                      onClick={() => setSummaryPeriod("all")}
                      className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${summaryPeriod === "all" ? "bg-[#A60069] text-white shadow" : "text-white/60 hover:text-white"}`}
                    >
                      Todos
                    </button>
                  </div>

                  <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10">
                    {(["Meta", "Google", "Offline"] as const).map((subtab) => (
                      <button
                        key={subtab}
                        onClick={() => setDarkCardTab(subtab)}
                        className={`px-2 py-1 text-[9px] font-bold rounded transition-all ${
                          darkCardTab === subtab
                            ? "bg-[#A60069] text-white shadow"
                            : "text-white/60 hover:text-white"
                        }`}
                      >
                        {subtab === "Offline" ? "Mídia Offline" : subtab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {darkCardTab === "Meta" && (
                <div className="flex-1 min-h-0 flex flex-col gap-2">
                  {!hasMetaAdsData ? (
                    <div className="flex-1 rounded-xl border border-[#D41473]/50 bg-white/[0.03] p-4 flex flex-col justify-center gap-2">
                      <h4 className="text-sm font-extrabold text-[#FF637E]">
                        Dados da Meta não enviados para esta competência.
                      </h4>
                      <p className="text-[10px] leading-relaxed text-white/60">
                        Cadastre investimento, impressões, cliques no link e visualizações da página em Envio e Integração.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          ["$", "Investimento", `R$ ${formatBRL(metaAdsTotals.investment)}`],
                          ["◉", "Impressões", formatDashboardNumber(metaAdsTotals.impressions)],
                          ["◌", "Alcance", formatDashboardNumber(metaAdsTotals.reach)],
                          ["↗", "Cliques no link", formatDashboardNumber(metaAdsTotals.linkClicks)],
                          ["●", "Leads", formatDashboardNumber(metaAdsTotals.leads)],
                        ].map(([icon, label, value]) => (
                          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D41473]/50 bg-[#D41473]/10 text-sm font-black text-[#FF637E]">{icon}</span>
                              <span className="min-w-0 truncate text-[8px] font-bold uppercase leading-tight text-white/55">{label}</span>
                            </div>
                            <strong className="mt-0.5 block whitespace-nowrap text-base leading-none text-white">{value}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-2 flex-1">
                        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 min-h-0">
                          <h4 className="mb-2.5 text-[12px] font-extrabold text-[#FF637E]">Jornada de Tráfego</h4>
                          <div className="space-y-3">
                            {[
                              ["Impressões", metaAdsTotals.impressions, "#1877F2", ""],
                              ["Cliques no link", metaAdsTotals.linkClicks, "#20C4E8", metaAdsMetrics.ctr === null ? "Não calculável" : `${formatMetaValue(metaAdsMetrics.ctr, "%")} CTR de link`],
                              ["Leads por canal", metaAdsTotals.leads, "#20C4E8", "Informado na planilha"],
                            ].map(([label, value, color, rate], index) => {
                              const max = Math.max(metaAdsTotals.impressions, 1);
                              const width = value === null ? 0 : Math.min(100, Math.max(3, (Number(value) / max) * 100));
                              return (
                                <div key={label}>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-white/80">
                                    <span>{label}</span><span className="font-black text-white">{value === null ? "Não disponível" : formatDashboardNumber(Number(value))}</span>
                                  </div>
                                  <div className="mt-1 h-5 overflow-hidden rounded-md bg-white/[0.08]"><div className="h-full rounded-md" style={{ width: `${width}%`, backgroundColor: color }} /></div>
                                  {index > 0 && <span className="text-[8px] text-white/55">{rate}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 min-h-0">
                          <h4 className="mb-2.5 text-[12px] font-extrabold text-[#FF637E]">Eficiência da campanha</h4>
                          <div className="grid grid-cols-2 divide-x divide-y divide-white/10 text-[10px]">
                            <div className="p-2"><span className="text-white/55">CTR de link</span><strong className="block text-lg text-amber-400">{formatMetaValue(metaAdsMetrics.ctr, "%")}</strong><small className="text-white/45">Taxa de cliques</small></div>
                            <div className="p-2"><span className="text-white/55">CPC de link</span><strong className="block text-lg text-emerald-400">{metaAdsMetrics.cpc === null ? "Não calculável" : `R$ ${formatBRL(metaAdsMetrics.cpc)}`}</strong><small className="text-white/45">Custo por clique</small></div>
                            <div className="p-2"><span className="text-white/55">CPM</span><strong className="block text-lg text-amber-400">{metaAdsMetrics.cpm === null ? "Não calculável" : `R$ ${formatBRL(metaAdsMetrics.cpm)}`}</strong><small className="text-white/45">Custo por mil impressões</small></div>
                            <div className="p-2"><span className="text-white/55">Custo por visualização</span><strong className="block text-lg text-emerald-400">{metaAdsMetrics.costPerView === null ? "Não calculável" : `R$ ${formatBRL(metaAdsMetrics.costPerView)}`}</strong><small className="text-white/45">Baseado em impressões</small></div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="min-w-0 rounded-xl border border-[#D41473]/60 bg-[#D41473]/[0.06] p-2.5"><strong className="block text-[11px] leading-tight text-[#FF637E]">LEADS INTEGRADOS</strong><span className="mt-1 block break-words text-[9px] leading-snug text-white/60">Leads por canal carregados da planilha. Vendas, CAC e ROAS ainda não estão disponíveis.</span></div>
                        <div className="min-w-0 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-2.5"><strong className="block text-[11px] leading-tight text-amber-300">TRÁFEGO MONITORADO</strong><span className="mt-1 block break-words text-[9px] leading-snug text-white/60">Investimento, impressões, alcance e cliques da competência.</span></div>
                      </div>
                    </>
                  )}
                  <p className="text-[8px] text-white/30 text-right">Fonte: {!hasMetaAdsData ? `dados indisponíveis | ${periodLabel}` : metaAdsIsActual ? `Meta Ads Manager | ${periodLabel}` : `simulação identificada | ${periodLabel}`}</p>
                </div>
              )}

              <div className={`flex-1 min-h-0 grid grid-rows-[auto_1fr_auto] gap-2 ${darkCardTab === "Meta" ? "hidden" : ""}`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    [
                      "$",
                      "Investimento",
                      `R$ ${channelInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    ],
                    ["●", "Leads", channelLeads.toLocaleString("pt-BR")],
                    ["🛒", "Vendas", channelSales.toLocaleString("pt-BR")],
                    [
                      "↗",
                      "ROAS",
                      channelRoas === null
                        ? "—"
                        : `${channelRoas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}x`,
                    ],
                  ].map(([icon, label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#D41473]/50 bg-[#D41473]/10 text-sm font-black text-[#FF637E]">
                          {icon}
                        </span>
                        <div>
                          <span className="block text-[8px] font-bold uppercase text-white/55">
                            {label}
                          </span>
                          <strong className="mt-0.5 block text-lg leading-none text-white">
                            {value}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 min-h-0">
                    <h4 className="mb-2.5 text-[12px] font-extrabold text-[#FF637E]">
                      Funil de Conversão
                    </h4>
                    <div className="space-y-2.5">
                      {funnelMetrics.map((item, index) => {
                        const itemValue = finiteNumber(item.value);
                        const previous =
                          index === 0
                            ? itemValue
                            : finiteNumber(funnelMetrics[index - 1].value);
                        const width =
                          finiteNumber(funnelMetrics[0].value) > 0
                            ? Math.max(
                                4,
                                (itemValue / finiteNumber(funnelMetrics[0].value)) * 100,
                              )
                            : 4;
                        return (
                          <div
                            key={item.name}
                            className="grid grid-cols-[78px_1fr_52px] items-center gap-2"
                          >
                            <span className="truncate text-[10px] font-bold text-white/80">
                              {item.name}
                            </span>
                            <div className="h-6 overflow-hidden rounded-md bg-white/[0.08]">
                              <div
                                className="h-full rounded-md"
                                style={{
                                  width: `${Math.min(100, width)}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                            <span className="text-right text-[10px] font-black text-white">
                              {itemValue.toLocaleString("pt-BR")}
                            </span>
                            {index > 0 && (
                              <span className="col-start-2 text-[8px] text-white/50">
                                ↓ {safeRate(itemValue, previous)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 min-h-0">
                    <h4 className="mb-2.5 text-[12px] font-extrabold text-[#FF637E]">
                      Eficiência da campanha
                    </h4>
                    <div className="grid grid-cols-2 divide-x divide-y divide-white/10 text-[10px]">
                      <div className="p-2">
                        <span className="text-white/55">CTR</span>
                        <strong className="block text-lg text-amber-400">
                          {safeRate(clicks, impressions)}
                        </strong>
                        <small className="text-white/45">Taxa de cliques</small>
                      </div>
                      <div className="p-2">
                        <span className="text-white/55">CPL</span>
                        <strong className="block text-lg text-emerald-400">
                          {channelCpl === null
                            ? "—"
                            : `R$ ${channelCpl.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`}
                        </strong>
                        <small className="text-white/45">Custo por lead</small>
                      </div>
                      <div className="p-2">
                        <span className="text-white/55">CAC</span>
                        <strong className="block text-lg text-amber-400">
                          {channelCac === null
                            ? "—"
                            : `R$ ${channelCac.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`}
                        </strong>
                        <small className="text-white/45">Custo por venda</small>
                      </div>
                      <div className="p-2">
                        <span className="text-white/55">Lead → venda</span>
                        <strong className="block text-lg text-emerald-400">
                          {safeRate(channelSales, channelLeads)}
                        </strong>
                        <small className="text-white/45">
                          Taxa de conversão
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[1.25fr_1fr] gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.025] p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#FF637E]">
                        Meta de vendas
                      </span>
                      <strong className="text-sm text-white">
                        {channelSales} de {salesGoal > 0 ? salesGoal : "—"}
                      </strong>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded bg-white/10">
                      <div
                        className="h-full rounded bg-[#D41473]"
                        style={{
                          width: `${Math.min(100, Math.max(0, salesProgress || 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-2">
                    <span className="text-[10px] font-extrabold text-amber-300">
                      {channelCac !== null && channelCac > 500
                        ? "Atenção: CAC elevado"
                        : channelRoas !== null && channelRoas < 2
                          ? "Atenção: ROAS abaixo da meta"
                          : "Desempenho dentro da meta"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3 shrink-0">
                {[
                  [
                    "Investimento",
                    `R$ ${channelInvestment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  ],
                  ["Leads", channelLeads.toLocaleString("pt-BR")],
                  ["Vendas", channelSales.toLocaleString("pt-BR")],
                  [
                    "ROAS",
                    channelRoas === null
                      ? "—"
                      : `${channelRoas.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}x`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="bg-white/5 rounded-xl border border-white/10 p-2"
                  >
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">
                      {label}
                    </span>
                    <span className="block text-sm font-extrabold mt-1 text-white leading-none">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="hidden grid grid-cols-2 gap-1.5 mt-1 shrink-0 text-[8px] text-white/70">
                <span>
                  CTR {safeRate(clicks, impressions)} · CPL{" "}
                  {channelCpl === null
                    ? "—"
                    : `R$ ${channelCpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className="text-right">
                  CAC{" "}
                  {channelCac === null
                    ? "—"
                    : `R$ ${channelCac.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}{" "}
                  · Conv. {safeRate(channelSales, channelLeads)}
                </span>
              </div>
              <div className="hidden mt-1.5 shrink-0 text-[8px] text-white/60">
                Meta de vendas: {channelSales.toLocaleString("pt-BR")} de{" "}
                {salesGoal > 0 ? salesGoal.toLocaleString("pt-BR") : "—"}{" "}
                {salesProgress === null
                  ? "—"
                  : `(${salesProgress.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%)`}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3 shrink-0 hidden">
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">
                    Impressões
                  </span>
                  <span className="text-sm font-extrabold mt-1 text-white leading-none">
                    {subMetrics.impressions}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">
                    Cliques
                  </span>
                  <span
                    className="text-sm font-extrabold mt-1 leading-none"
                    style={{ color: channelAccent }}
                  >
                    {subMetrics.clicks}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">
                    Leads
                  </span>
                  <span
                    className="text-sm font-extrabold mt-1 leading-none"
                    style={{ color: channelAccent }}
                  >
                    {subMetrics.leads}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">
                    Campanhas
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold mt-1 text-white leading-none">
                      {subMetrics.camp}
                    </span>
                    <span className="text-[8px] text-white/40 leading-none">
                      - 0
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">
                    Investimento
                  </span>
                  <span className="text-sm font-extrabold mt-1 text-white leading-none">
                    {subMetrics.invested}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between max-h-[46px]">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">
                    Conversões
                  </span>
                  <span className="text-sm font-extrabold mt-1 text-white leading-none">
                    {subMetrics.conv}
                  </span>
                </div>
                <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex flex-col justify-between max-h-[46px]">
                  <span className="text-[8px] uppercase tracking-wider font-extrabold text-white/50 leading-none">
                    Taxa de agendamento
                  </span>
                  <span className="text-sm font-extrabold mt-1 text-white leading-none">
                    {subMetrics.txAgend}
                  </span>
                </div>
              </div>
              <p className={`text-[8px] text-white/30 text-right mt-1.5 shrink-0 ${darkCardTab === "Meta" ? "hidden" : ""}`}>
                Fonte: {isDefaultData ? "Dados padrão de Maio/2026" : `Envio de Dados (${periodLabel})`}
              </p>
            </div>

            {/* 2. Middle Column: Conversão & Funil / Demografias (Grid Column Span 4) */}
            <div
              id="middle-tabs-card"
              className="glass-card shadow-sm p-3.5 flex flex-col lg:col-span-4 h-auto lg:min-h-0 justify-between gap-2.5 lg:gap-0 min-h-[260px] sm:min-h-[300px] overflow-hidden"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-1 border-b border-border pb-2 mb-2 shrink-0">
                {[
                  { id: "Evolução", label: "Evolução Mensal" },
                  { id: "Planos", label: "Cidades" },
                  { id: "Funil", label: "Funil de Conversão" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMiddleCardTab(tab.id as any)}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all ${
                      middleCardTab === tab.id
                        ? "bg-[#A60069] text-white shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 flex min-h-[200px] min-h-0 flex-col justify-start lg:min-h-0">
                {middleCardTab === "Funil" && (
                  <div className="grid grid-cols-[110px_1fr_95px] items-center gap-1 h-full min-h-0">
                    {/* Visual Left KPI list */}
                    <div className="space-y-2.5 py-1">
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">
                          Impressões
                        </span>
                        <span className="text-xs font-black text-text-primary leading-none">
                          {funnelMetrics[0].value.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[8px] text-text-secondary block leading-none mt-0.5">
                          ~ 0,0%
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">
                          Cliques
                        </span>
                        <span className="text-xs font-black text-text-primary leading-none">
                          {funnelMetrics[1].value.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[8px] text-text-secondary block leading-none mt-0.5">
                          ~ 0,0%
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">
                          Leads
                        </span>
                        <span className="text-xs font-black text-text-primary leading-none">
                          {funnelMetrics[2].value.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[8px] text-success font-bold block leading-none mt-0.5">
                          ↑ 9,8%
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">
                          Agendamentos
                        </span>
                        <span className="text-xs font-black text-text-primary leading-none">
                          {funnelMetrics[3].value.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[8px] text-success font-bold block leading-none mt-0.5">
                          ↑ 23,5%
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block uppercase leading-none">
                          Vendas
                        </span>
                        <span className="text-xs font-black text-text-primary leading-none">
                          {funnelMetrics[4].value.toLocaleString("pt-BR")}
                        </span>
                        <span className="text-[8px] text-success font-bold block leading-none mt-0.5">
                          ↑ 20,0%
                        </span>
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
                        <span className="text-[8px] text-text-secondary font-bold block leading-none">
                          CTR (Clicks)
                        </span>
                        <span className="text-[11px] font-bold text-text-primary leading-none block mt-0.5">
                          {safeRate(clicks, impressions)}
                        </span>
                        <span className="text-[8px] text-success font-bold block mt-0.5">
                          —
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block leading-none">
                          Conv. Leads
                        </span>
                        <span className="text-[11px] font-bold text-text-primary leading-none block mt-0.5">
                          {safeRate(channelLeads, clicks)}
                        </span>
                        <span className="text-[8px] text-success font-bold block mt-0.5">
                          —
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block leading-none">
                          Tx. Agend.
                        </span>
                        <span className="text-[11px] font-bold text-text-primary leading-none block mt-0.5">
                          {safeRate(periodSummary.appointments.current, channelLeads)}
                        </span>
                        <span className="text-[8px] text-success font-bold block mt-0.5">
                          —
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-text-secondary font-bold block leading-none">
                          Aprov. Com.
                        </span>
                        <span className="text-[11px] font-bold text-text-primary leading-none block mt-0.5">
                          {safeRate(channelSales, periodSummary.appointments.current)}
                        </span>
                        <span className="text-[8px] text-success font-bold block mt-0.5">
                          —
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {middleCardTab === "Planos" && (
                  <div className="h-full min-h-0 overflow-hidden rounded-xl border border-border bg-white p-1.5 text-text-primary">
                    {!operationalData ? (
                      <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-[10px] font-bold text-amber-800">
                        Dados não enviados para a competência selecionada.
                      </div>
                    ) : (
                      <div className="flex h-full min-h-0 flex-col gap-2">
                        {!cityDataConsistent && (
                          <div className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[8px] font-bold text-rose-700">
                            Inconsistência de conciliação em {selectedMonth}.
                          </div>
                        )}
                        {operationalData.entriesByCity.length < 6 && (
                          <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold text-amber-800">
                            {operationalData.entriesByCity.length} cidade(s) encontrada(s); abas municipais ausentes não foram preenchidas.
                          </div>
                        )}
                        <div className="grid shrink-0 grid-cols-2 gap-2">
                          <CityMetricCard
                            value={formatCityCount(evolutionEntries, cityIsPartial)}
                            label={`Entradas em ${cityMonthName.toLowerCase()}`}
                            tone="neutral"
                          />
                          <CityMetricCard
                            value={String(operationalData.entriesByCity.length)}
                            label="Cidades acompanhadas"
                            tone="neutral"
                          />
                          <CityMetricCard
                            value={formatCityBalance(evolutionBalance, cityIsPartial)}
                            label="Saldo do mês"
                            tone={evolutionBalance > 0 ? "positive" : evolutionBalance < 0 ? "negative" : "neutral"}
                          />
                          <CityMetricCard
                            value={cityIsPartial ? "Dado parcial" : `${Math.round(cityConcentration)}%`}
                            label={cityIsPartial ? "Concentração provisória" : cityLeader ? `Concentração das entradas em ${cityLeader.plan}` : "Concentração das entradas"}
                            tone={cityIsPartial ? "partial" : "neutral"}
                            title={cityIsPartial ? "Existem quantidades ausentes nesta competência" : undefined}
                          />
                        </div>
                        <div className="flex flex-none flex-col">
                          <h3 className="shrink-0 text-[10px] font-black">
                            Distribuição das entradas — {cityMonthName}
                          </h3>
                          <div className="mt-2 grid flex-none grid-cols-1 gap-y-1.5">
                            {cityDistribution.map((city, index) => {
                              const rawPercent = cityTotal > 0 ? (city.count / cityTotal) * 100 : 0;
                              const percent = Math.round(rawPercent);
                              const colors = ["#C00072", "#D41473", "#E83E72", "#F06B91", "#F5A0B8", "#F8CBD8"];
                              return (
                                <div key={city.plan} className="min-w-0">
                                  <div className="flex items-center justify-between gap-1 text-[9px] font-bold leading-tight">
                                    <span className="min-w-0 truncate" title={city.plan}>{city.plan}</span>
                                    <span className={city.partial || cityIsPartial ? "shrink-0 text-amber-700" : "shrink-0"}>
                                      {formatCityCount(city.count, city.partial)} · {percent}%
                                    </span>
                                  </div>
                                  <div className="mt-1 h-1.5 rounded-full bg-pink-50">
                                    <div className={`h-1.5 rounded-full ${city.partial || cityIsPartial ? "bg-amber-500" : ""}`} style={{ width: `${Math.min(100, Math.max(0, rawPercent))}%`, backgroundColor: city.partial || cityIsPartial ? undefined : colors[index] }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="min-h-0 shrink-0">
                          <h3 className="text-[10px] font-black">Movimentação em {cityMonthName.toLowerCase()}</h3>
                          <div className="mt-1.5 overflow-hidden rounded-lg border border-border text-[8px] leading-tight">
                            <div className="grid grid-cols-4 bg-slate-50 px-2 py-1.5 font-black">
                              <span>Cidade</span><span>Entradas</span><span>Cancelamentos</span><span>Saldo</span>
                            </div>
                            {cityMovement.map((city) => {
                              const balance = city.entries - city.cancellations;
                              const partial = city.partial || cityIsPartial;
                              return (
                                <div key={city.plan} className="grid grid-cols-4 border-t border-border px-2 py-1.5">
                                  <span className="truncate" title={city.plan}>{city.plan}</span>
                                  <span className={partial ? "text-amber-700" : "text-emerald-600"}>{formatCityCount(city.entries, city.partial)}</span>
                                  <span className="text-rose-600">{Math.trunc(city.cancellations).toLocaleString("pt-BR")}</span>
                                  <span className={partial ? "text-amber-700" : balance > 0 ? "text-emerald-600" : balance < 0 ? "text-rose-600" : "text-slate-500"}>{formatCityBalance(balance, partial)}</span>
                                </div>
                              );
                            })}
                            <div className="grid grid-cols-4 border-t border-border px-2 py-1.5 font-black">
                              <span>Total</span>
                              <span className={cityIsPartial ? "text-amber-700" : "text-emerald-600"}>{formatCityCount(evolutionEntries, cityIsPartial)}</span>
                              <span className="text-rose-600">{Math.trunc(evolutionCancellations).toLocaleString("pt-BR")}</span>
                              <span className={cityIsPartial ? "text-amber-700" : evolutionBalance > 0 ? "text-emerald-600" : evolutionBalance < 0 ? "text-rose-600" : "text-slate-500"}>{formatCityBalance(evolutionBalance, cityIsPartial)}</span>
                            </div>
                          </div>
                        </div>
                        <p className={`shrink-0 text-center text-[7px] font-bold leading-none ${cityIsPartial ? "text-amber-700" : "text-text-secondary"}`}>
                          {cityIsPartial ? "Dados parciais: existem quantidades não informadas na planilha." : "Dados referentes à competência selecionada no Dashboard."}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {middleCardTab === "Evolução" && (
                  <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden pr-0.5">
                    {!operationalData && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[9px] font-bold text-amber-800">
                        Dados não enviados para o período selecionado.
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <EvolutionSummary
                        icon={Users}
                        title="Novos beneficiários"
                        value={evolutionEntries}
                        subtitle={`Entradas em ${selectedMonth.split("/")[0]?.toLowerCase() || "mês"}`}
                        tone="green"
                      />
                      <EvolutionSummary
                        icon={XCircle}
                        title="Cancelamentos"
                        value={evolutionCancellations}
                        subtitle={`Exclusões em ${selectedMonth.split("/")[0]?.toLowerCase() || "mês"}`}
                        tone="red"
                      />
                      <EvolutionSummary
                        icon={TrendingUp}
                        title="Saldo líquido"
                        value={evolutionBalance}
                        subtitle="Entradas menos cancelamentos"
                        tone={
                          evolutionBalance > 0
                            ? "green"
                            : evolutionBalance < 0
                              ? "red"
                              : "neutral"
                        }
                        signed
                      />
                    </div>
                    <div className="grid min-h-[132px] flex-none grid-cols-1 gap-2 xl:min-h-[150px] xl:grid-cols-2">
                      <EvolutionBreakdown
                        title={`ENTRADAS POR CIDADE — ${selectedMonth.split("/")[0]?.toUpperCase() || "MÊS"}`}
                        items={operationalEntryCategories}
                        total={evolutionEntries}
                        tone="green"
                        emptyText="Composição de entradas não disponível para o período selecionado."
                      />
                      <EvolutionBreakdown
                        title={`MOTIVOS DOS CANCELAMENTOS — ${selectedMonth.split("/")[0]?.toUpperCase() || "MÊS"}`}
                        items={operationalCancellationCategories}
                        total={evolutionCancellations}
                        tone="red"
                        emptyText="Nenhum motivo de cancelamento disponível para o período selecionado."
                      />
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-text-secondary">
                      <Info className="h-3 w-3" /> Clique em uma categoria para
                      filtrar o histórico.
                    </div>
                    <div className="shrink-0 overflow-hidden rounded-xl border border-border">
                      <div className="min-w-0 w-full">
                        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-2 border-b border-border px-2 py-1.5 text-[9px] font-black text-text-secondary">
                          <span>Mês</span>
                          <span className="text-emerald-600">Entradas</span>
                          <span className="text-rose-600">Cancelamentos</span>
                          <span>Saldo</span>
                        </div>
                        {(operationalHistory.length > 0 ? operationalHistory : []).map((record) => {
                          const operational = record.operationalData;
                          if (!operational) return null;
                          const balance = operational.balance;
                          return (
                            <div
                              key={operational.competence}
                              className={`grid grid-cols-[1.2fr_1fr_1fr_0.8fr] gap-2 border-b border-border px-2 py-1.5 text-[10px] last:border-0 ${record.month === selectedMonth ? "bg-emerald-50 font-black" : ""}`}
                            >
                              <span>{operational.competence}</span>
                              <span className={operational.status === "partial" ? "text-amber-600" : "text-emerald-600"} title={operational.status === "partial" ? "Quantidade ausente em um ou mais registros" : undefined}>
                                {operational.status === "partial" ? "≥ " : ""}{operational.entries.toLocaleString("pt-BR")}
                              </span>
                              <span className="text-rose-600">
                                {operational.cancellations.toLocaleString("pt-BR")}
                              </span>
                              <span
                                className={
                                  balance > 0
                                    ? "text-emerald-600"
                                    : balance < 0
                                      ? "text-rose-600"
                                      : "text-slate-500"
                                }
                              >
                                {operational.status === "partial" ? "≥ " : ""}{balance > 0 ? "+" : ""}{balance.toLocaleString("pt-BR")}
                              </span>
                            </div>
                          );
                        })}
                        {operationalHistory.length === 0 && (
                          <div className="px-2 py-3 text-[9px] text-text-secondary">Dados não enviados para o período.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: 3 columns of space exclusively for Investimentos do Mês */}
        <div className="lg:col-span-3 h-auto lg:h-full lg:min-h-0 flex flex-col mt-4 lg:mt-0">
          <div
            id="investments-month-card"
            className="glass-card shadow-sm p-4 flex flex-col justify-between h-auto lg:h-full lg:min-h-0 select-none min-h-[280px] sm:min-h-[320px] lg:min-h-0"
          >
            <div className="flex flex-col h-full min-h-0 justify-between">
              {/* Header section identical style to image */}
              <div className="flex items-baseline justify-between gap-1.5 shrink-0 pb-1.5">
                <h3 className="font-extrabold text-text-primary text-xs flex items-center gap-1 leading-none">
                  <BarChart2 className="w-3.5 h-3.5 text-[#A60069]" />{" "}
                  Investimentos do Mês
                </h3>
                <div className="text-right leading-none">
                  <p className="text-[8px] font-bold text-text-secondary uppercase tracking-wider block">
                    TOTAL
                  </p>
                  <p className="text-sm lg:text-base font-black text-[#A60069] mt-0.5 block whitespace-nowrap">
                    R$ {formatBRL(totalPeriodInvestment)}
                  </p>
                </div>
              </div>

              {/* Sub Filter pills style with thin outline */}
              <div className="flex items-center gap-1 flex-wrap pb-2 mb-1 border-b border-border shrink-0">
                {(
                  [
                    "Todos",
                    "Marketing",
                    "Ads",
                    "Offline",
                    "Ferramentas",
                  ] as const
                ).map((filterPill) => (
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
                    <div
                      key={index}
                      className="grid grid-cols-[65px_1fr_60px] items-center text-[10px] py-1 border-b border-border last:border-b-0 leading-tight"
                    >
                      <span className="text-[#64748B] font-medium">
                        {item.month}
                      </span>
                      <div className="flex items-center gap-1 truncate pr-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        ></span>
                        <span
                          className="text-text-primary font-semibold truncate"
                          title={item.label}
                        >
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
                <span>Última atualização: {formatUpdatedAt(dashboardData.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvolutionSummary({
  icon: Icon,
  title,
  value,
  subtitle,
  tone,
  signed = false,
}: {
  icon: typeof Users;
  title: string;
  value: number;
  subtitle: string;
  tone: "green" | "red" | "neutral";
  signed?: boolean;
}) {
  const colors = {
    green: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
    red: "border-rose-100 bg-rose-50/70 text-rose-800",
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
  };
  return (
    <div className={`rounded-xl border p-2 ${colors[tone]}`}>
      <div className="flex min-w-0 items-start gap-1.5">
        <div className="shrink-0 rounded-full bg-white/70 p-1.5">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <span className="block line-clamp-2 text-[8px] font-black uppercase leading-tight tracking-wider">
            {title}
          </span>
          <strong className="block text-lg font-black leading-tight">
            {signed && value > 0 ? "+" : ""}
            {formatDashboardNumber(value)}
          </strong>
          <span className="block line-clamp-2 text-[8px] font-bold leading-tight opacity-80">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

function EvolutionBreakdown({
  title,
  items,
  total,
  tone,
  emptyText,
}: {
  title: string;
  items: readonly (readonly [string, number, string])[];
  total: number;
  tone: "green" | "red";
  emptyText: string;
}) {
  const safeTotal = finiteNumber(total);
  const totalItems = items.reduce(
    (sum, item) => sum + finiteNumber(item[1]),
    0,
  );
  const barColors = tone === "green" ? "bg-emerald-500" : "bg-rose-500";
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col rounded-xl border border-border p-2.5">
      <h3
        className={`truncate text-[9px] font-black tracking-wider ${tone === "green" ? "text-emerald-700" : "text-rose-700"}`}
      >
        {title}
      </h3>
      <div className="mt-1.5 flex h-3 overflow-hidden rounded-md bg-slate-100">
        {items.map(([label, value, color]) => (
          <span
            key={label}
            title={`${label}: ${value} (${safeTotal > 0 ? ((finiteNumber(value) / safeTotal) * 100).toFixed(1) : "0.0"}%)`}
            className={barColors}
              style={{
              width: `${safeTotal > 0 ? Math.min(100, Math.max(0, (finiteNumber(value) / safeTotal) * 100)) : 0}%`,
              backgroundColor: color,
            }}
          />
        ))}
      </div>
      {totalItems === 0 && (
        <p className="mt-1 text-[8px] text-text-secondary">{emptyText}</p>
      )}
      <div className="mt-1 flex min-h-0 flex-1 flex-col justify-evenly">
        {items.map(([label, value, color]) => (
          <div
            key={label}
            className="flex min-w-0 items-center justify-between gap-1 border-b border-border py-1 text-[9px] last:border-0"
          >
              <span className="flex min-w-0 items-center gap-1.5 truncate">
              <i
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
              <strong className="shrink-0">{Number(value).toLocaleString("pt-BR")}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function CityMetricCard({
  value,
  label,
  tone,
  title,
}: {
  value: string;
  label: string;
  tone: "neutral" | "positive" | "negative" | "partial";
  title?: string;
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "negative"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : tone === "partial"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-border bg-white text-text-primary";
  return (
    <div className={`min-w-0 rounded-lg border p-2.5 ${toneClass}`} title={title}>
      <strong className="block truncate text-xl font-black leading-none">
        {value}
      </strong>
      <span className="mt-1 block truncate text-[8px] font-bold leading-tight">
        {label}
      </span>
    </div>
  );
}
