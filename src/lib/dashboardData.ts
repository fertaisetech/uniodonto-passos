import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { auth, db, type AppUserProfile } from "./firebase";
import { getMonthlyInvestmentValues } from "./investmentMonthlyData";
import { getOfficialMetaAdsCampaigns } from "./metaAdsMonthlyData";
import type { MonthlyOperationalData } from "./operationalSpreadsheet";
import {
  OFFICIAL_CITIES,
  OFFICIAL_DASHBOARD_SOURCE_VERSION,
  OFFICIAL_INVESTMENTS_2026,
  OFFICIAL_META_2026,
  OFFICIAL_MONTHS_2026,
  OFFICIAL_OPERATIONAL_2026,
  getOfficialBeneficiaries,
  getOfficialBeneficiaryEvolution,
  getOfficialMonthIndex,
  getOfficialStatuses,
  type OfficialDataStatus,
  type OfficialMonth2026,
} from "./officialDashboard2026Data";

export type MonthKey = string;

export interface SummaryMetric {
  current: number;
  previous: number;
  variation: number;
  target?: number;
  available?: boolean;
}

export interface SummaryData {
  beneficiaries: SummaryMetric;
  additions: SummaryMetric;
  cancellations: SummaryMetric;
  investment: SummaryMetric;
  roi: SummaryMetric;
  leads: SummaryMetric;
  appointments: SummaryMetric;
  sales: SummaryMetric;
  cac: SummaryMetric;
  nps: SummaryMetric;
}

export interface BeneficiariesData {
  evolution: Array<{ date: string; count: number }>;
  distribution: Array<{ plan: string; count: number }>;
  cityMovement?: Array<{
    city: string;
    entries: number;
    cancellations: number;
  }>;
}

export interface FunnelDataPoint {
  stage: string;
  count: number;
}

export interface NpsDataPoint {
  date: string;
  score: number;
}

export interface FinancialData {
  /** Receita ou retorno financeiro atribuído ao período. */
  revenue: number | null;
}

export interface NpsSurveyData {
  promoters: number | null;
  passives: number | null;
  detractors: number | null;
}

export const calculateRoiPercent = (
  revenue: number | null | undefined,
  investment: number | null | undefined,
) => {
  if (revenue === null || revenue === undefined || investment === null || investment === undefined) {
    return null;
  }
  const safeRevenue = Number(revenue);
  const safeInvestment = Number(investment);
  if (!Number.isFinite(safeRevenue) || safeRevenue < 0 || !Number.isFinite(safeInvestment) || safeInvestment <= 0) {
    return null;
  }
  return Number(((safeRevenue / safeInvestment) * 100).toFixed(2));
};

export const calculateNpsScore = (survey: NpsSurveyData | null | undefined) => {
  const rawValues = [survey?.promoters, survey?.passives, survey?.detractors];
  if (rawValues.some((value) => value === null || value === undefined)) return null;
  const values = rawValues.map(Number);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) return null;
  const [promoters, passives, detractors] = values;
  const total = promoters + passives + detractors;
  if (total <= 0) return null;
  return Number((((promoters - detractors) / total) * 100).toFixed(1));
};

export interface InvestmentItem {
  id: string;
  checked: boolean;
  source: string;
  category: "Ads" | "Software" | "Offline" | "Marketing";
  isFixed: boolean;
  value: number;
}

export interface MetricItem {
  id: string;
  checked: boolean;
  label: string;
  category: string;
  value: string;
  unit: string;
  isCustomCampaign?: boolean;
}

export type CampaignDataMode = "actual" | "simulated";

export interface MetaAdsCampaign {
  id: string;
  channel: "Meta";
  competence: MonthKey;
  dataMode: CampaignDataMode;
  campaignName: string;
  campaignId?: string;
  investment: number | null;
  impressions: number | null;
  reach?: number | null;
  linkClicks: number | null;
  leads: number | null;
  pageViews: number | null;
  lastUpdated: string;
  notes?: string;
  active: boolean;
}

export interface MetaAdsCalculatedMetrics {
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  costPerView: number | null;
  clickToPageRate: number | null;
}

export interface MarketingFunnelData {
  impressions: number;
  clicks: number;
  leads: number;
  appointments: number;
  sales: number;
}

const parseMetricNumber = (value: string | number | null | undefined) => {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : 0;
  const normalized = String(value ?? "")
    .replace(/[^0-9,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

/**
 * Builds the dashboard funnel from the selected monthly sources.
 * Meta traffic is authoritative for impressions, clicks and channel leads;
 * operational summary is authoritative for appointments and sales.
 */
export const buildMarketingFunnelData = ({
  summary,
  metrics,
  metaAdsCampaigns = [],
}: {
  summary: SummaryData;
  metrics: MetricItem[];
  metaAdsCampaigns?: MetaAdsCampaign[];
}): MarketingFunnelData => {
  const metaTotals = metaAdsCampaigns
    .filter((campaign) => campaign.active && campaign.channel === "Meta")
    .reduce(
      (totals, campaign) => ({
        impressions: totals.impressions + parseMetricNumber(campaign.impressions),
        clicks: totals.clicks + parseMetricNumber(campaign.linkClicks),
        leads: totals.leads + parseMetricNumber(campaign.leads),
      }),
      { impressions: 0, clicks: 0, leads: 0 },
    );

  const metricValue = (id: string, label: string) => {
    const item = metrics.find(
      (metric) =>
        metric.checked &&
        (metric.id === id || metric.label.toLowerCase() === label.toLowerCase()),
    );
    return parseMetricNumber(item?.value);
  };

  const hasOfficialMetaTraffic =
    metaAdsCampaigns.length > 0 &&
    (metaTotals.impressions > 0 || metaTotals.clicks > 0 || metaTotals.leads > 0);
  const wholeCount = (value: number) => Math.max(0, Math.round(Number(value) || 0));

  return {
    impressions: hasOfficialMetaTraffic ? metaTotals.impressions : metricValue("imp", "Impressões"),
    clicks: hasOfficialMetaTraffic ? metaTotals.clicks : metricValue("clic", "Cliques"),
    leads: hasOfficialMetaTraffic
      ? metaTotals.leads
      : metricValue("leads_canal", "Leads por Canal") || Math.max(0, Number(summary.leads.current) || 0),
    appointments: wholeCount(summary.appointments.current),
    sales: wholeCount(summary.sales.current),
  };
};

export const calculateMetaAdsMetrics = (
  campaign: Pick<MetaAdsCampaign, "investment" | "impressions" | "linkClicks" | "pageViews">,
): MetaAdsCalculatedMetrics => {
  const investment = Number(campaign.investment);
  const impressions = Number(campaign.impressions);
  const linkClicks = Number(campaign.linkClicks);
  const pageViews = Number(campaign.pageViews);
  const valid = (value: number) => Number.isFinite(value) && value >= 0;
  const ratio = (numerator: number, denominator: number) =>
    valid(numerator) && valid(denominator) && denominator > 0
      ? (numerator / denominator) * 100
      : null;

  return {
    ctr: ratio(linkClicks, impressions),
    cpc: valid(investment) && valid(linkClicks) && linkClicks > 0 ? investment / linkClicks : null,
    cpm: valid(investment) && valid(impressions) && impressions > 0 ? (investment / impressions) * 1000 : null,
    costPerView:
      valid(investment) && valid(pageViews) && pageViews > 0
        ? investment / pageViews
        : null,
    clickToPageRate: ratio(pageViews, linkClicks),
  };
};

export interface MonthlyDashboardDocument {
  month: MonthKey;
  dataVersion?: string;
  summary: SummaryData;
  beneficiariesData: BeneficiariesData;
  funnelData: FunnelDataPoint[];
  npsData: NpsDataPoint[];
  financialData?: FinancialData;
  npsSurvey?: NpsSurveyData;
  investments: InvestmentItem[];
  metrics: MetricItem[];
  metaAdsCampaigns?: MetaAdsCampaign[];
  operationalData?: MonthlyOperationalData;
  dataQuality?: {
    source: string;
    sourceVersion: string;
    operationalStatus: OfficialDataStatus;
    marketingStatus: OfficialDataStatus;
    investmentStatus: OfficialDataStatus;
    netNewSales?: number;
    warnings: string[];
    assumptions: string[];
  };
  cancellationReasons: Array<{
    reason: string;
    count: number;
  }>;
  updatedAt?: unknown;
  updatedBy?: AppUserProfile | null;
}

type MonthlyDashboardSnapshotHandler = (
  data: MonthlyDashboardDocument | null,
  error?: Error | null,
) => void;

const DEFAULT_MONTH = "Maio/2026";

const baseInvestments: InvestmentItem[] = [
  {
    id: "1",
    checked: true,
    source: "Rádio Vida (Passos)",
    category: "Offline",
    isFixed: false,
    value: 1750.0,
  },
  {
    id: "2",
    checked: true,
    source: "Rádio (Itaú de Minas)",
    category: "Offline",
    isFixed: false,
    value: 240.0,
  },
  {
    id: "3",
    checked: true,
    source: "Rádio (S. S. Paraíso)",
    category: "Offline",
    isFixed: false,
    value: 79.0,
  },
  {
    id: "4",
    checked: true,
    source: "Rádio (Cássia)",
    category: "Offline",
    isFixed: false,
    value: 271.0,
  },
  {
    id: "5",
    checked: true,
    source: "Jornal (Folha da Manhã)",
    category: "Offline",
    isFixed: false,
    value: 120.18,
  },
  {
    id: "6",
    checked: true,
    source: "Telão/Painel LED (Paraíso)",
    category: "Offline",
    isFixed: false,
    value: 400.0,
  },
  {
    id: "7",
    checked: true,
    source: "Meta (Facebook/Instagram)",
    category: "Ads",
    isFixed: false,
    value: 1242.0,
  },
  {
    id: "8",
    checked: true,
    source: "Google Ads",
    category: "Ads",
    isFixed: false,
    value: 800.0,
  },
  {
    id: "9",
    checked: true,
    source: "Agência de Marketing",
    category: "Marketing",
    isFixed: false,
    value: 2000.0,
  },
  {
    id: "10",
    checked: true,
    source: "RD Station (Mkt e Conversas)",
    category: "Software",
    isFixed: false,
    value: 1121.0,
  },
  {
    id: "11",
    checked: true,
    source: "RD Conversas",
    category: "Software",
    isFixed: false,
    value: 2087.28,
  },
  {
    id: "12",
    checked: true,
    source: "RD Marketing",
    category: "Software",
    isFixed: false,
    value: 1121.0,
  },
  {
    id: "13",
    checked: true,
    source: "RD CRM",
    category: "Software",
    isFixed: false,
    value: 786.0,
  },
  {
    id: "14",
    checked: true,
    source: "FerTaise",
    category: "Software",
    isFixed: false,
    value: 2000.0,
  },
];

const baseMetrics: MetricItem[] = [
  {
    id: "impr",
    checked: true,
    label: "Impressões",
    category: "TODOS",
    value: "150.000",
    unit: "imp.",
  },
  {
    id: "clic",
    checked: true,
    label: "Cliques",
    category: "TODOS",
    value: "3.250",
    unit: "cliques",
  },
  {
    id: "ctr",
    checked: true,
    label: "CTR",
    category: "TODOS",
    value: "2,17",
    unit: "%",
  },
  {
    id: "cpc",
    checked: true,
    label: "CPC",
    category: "TODOS",
    value: "3,94",
    unit: "R$",
  },
  {
    id: "leads_canal",
    checked: true,
    label: "Leads por Canal",
    category: "TODOS",
    value: "420",
    unit: "leads",
  },
  {
    id: "conv_canal",
    checked: true,
    label: "Conversões por Canal",
    category: "TODOS",
    value: "86",
    unit: "vendas",
  },
  {
    id: "agend",
    checked: true,
    label: "Agendamentos",
    category: "TODOS",
    value: "108",
    unit: "agend.",
  },
  {
    id: "vendas_canal",
    checked: true,
    label: "Vendas",
    category: "TODOS",
    value: "86",
    unit: "vendas",
  },
  {
    id: "camp_g1",
    checked: true,
    label: "Google Ads - Captação Passos",
    category: "Google Ads",
    value: "Clique",
    unit: "",
    isCustomCampaign: true,
  },
  {
    id: "camp_g2",
    checked: true,
    label: "Google Ads - Plano Individual",
    category: "Google Ads",
    value: "Clique",
    unit: "",
    isCustomCampaign: true,
  },
  {
    id: "camp_m1",
    checked: true,
    label: "Meta Ads - Conversão Convênio",
    category: "Meta Ads",
    value: "Clique",
    unit: "",
    isCustomCampaign: true,
  },
  {
    id: "camp_m2",
    checked: true,
    label: "Meta Ads - Remarketing Família",
    category: "Meta Ads",
    value: "Clique",
    unit: "",
    isCustomCampaign: true,
  },
];

export const calculateInvestmentTotal = (investments: InvestmentItem[]) =>
  Number(
    investments
      .filter((item) => item.checked)
      .reduce((acc, curr) => acc + curr.value, 0)
      .toFixed(2),
  );

const metricVariation = (current: number, previous: number) =>
  previous === 0 ? 0 : Number((((current - previous) / previous) * 100).toFixed(1));

const makeOfficialMetric = (
  current: number,
  previous: number,
  available = true,
  target?: number,
): SummaryMetric => ({
  current: Number.isFinite(current) ? current : 0,
  previous: Number.isFinite(previous) ? previous : 0,
  variation: available ? metricVariation(current, previous) : 0,
  available,
  ...(target === undefined ? {} : { target }),
});

const officialOperationalData = (month: MonthKey): MonthlyOperationalData | undefined => {
  const input = OFFICIAL_OPERATIONAL_2026[month as OfficialMonth2026];
  const monthIndex = getOfficialMonthIndex(month);
  if (!input || monthIndex < 0) return undefined;
  return {
    competence: `2026-${String(monthIndex + 1).padStart(2, "0")}`,
    year: 2026,
    month: monthIndex + 1,
    status: input.status === "partial" ? "partial" : "complete",
    entries: input.entries,
    cancellations: input.cancellations,
    balance: input.entries - input.cancellations,
    entriesByCity: OFFICIAL_CITIES.map((city) => ({
      cityKey: city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-"),
      cityOriginal: city,
      cityName: city,
      entries: input.entriesByCity[city] || 0,
      cancellations: input.cancellationsByCity[city] || 0,
      partial: input.status === "partial",
    })),
    cancellationReasons: Object.entries(input.cancellationReasons).map(([reason, quantity]) => ({
      reasonOriginal: reason,
      reasonNormalized: reason.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
      quantity,
    })),
    warnings: [],
    source: {
      fileName: "BASE-DADOS-DASHBOARD-UNIODONTO-2026.xlsx",
      importedAt: "2026-08-11T00:00:00.000Z",
    },
  };
};

const buildMonthlyDocument = (requestedMonth: MonthKey): MonthlyDashboardDocument => {
  const month = requestedMonth === "Todos" ? "Junho/2026" : requestedMonth;
  const index = Math.max(0, getOfficialMonthIndex(month));
  const previousMonth = OFFICIAL_MONTHS_2026[Math.max(0, index - 1)];
  const operational = OFFICIAL_OPERATIONAL_2026[month as OfficialMonth2026];
  const previousOperational = OFFICIAL_OPERATIONAL_2026[previousMonth];
  const meta = OFFICIAL_META_2026[month as OfficialMonth2026];
  const previousMeta = OFFICIAL_META_2026[previousMonth];
  const statuses = getOfficialStatuses(month);
  const monthlyInvestmentValues = getMonthlyInvestmentValues(month);
  const investmentItems: InvestmentItem[] = OFFICIAL_INVESTMENTS_2026.map((item) => ({
    id: item.id,
    checked: true,
    source: item.source,
    category: item.category,
    isFixed: false,
    value: monthlyInvestmentValues[item.id] ?? 0,
  }));
  const investmentTotal = calculateInvestmentTotal(investmentItems);
  const previousInvestmentTotal = calculateInvestmentTotal(
    OFFICIAL_INVESTMENTS_2026.map((item) => ({
      id: item.id,
      checked: true,
      source: item.source,
      category: item.category,
      isFixed: false,
      value: item.values[Math.max(0, index - 1)] ?? 0,
    })),
  );
  const beneficiaries = getOfficialBeneficiaries(month);
  const previousBeneficiaries = index === 0 ? 10289 : getOfficialBeneficiaries(previousMonth);
  const netNew = operational?.netNew || 0;
  const previousNetNew = previousOperational?.netNew || 0;
  const cac = netNew > 0 ? Number((investmentTotal / netNew).toFixed(2)) : 0;
  const previousCac = previousNetNew > 0 ? Number((previousInvestmentTotal / previousNetNew).toFixed(2)) : 0;
  const operationAvailable = Boolean(operational);
  const marketingAvailable = Boolean(meta);
  const summary: SummaryData = {
    beneficiaries: makeOfficialMetric(beneficiaries, previousBeneficiaries, operationAvailable || index > 0),
    additions: makeOfficialMetric(operational?.entries || 0, previousOperational?.entries || 0, operationAvailable),
    cancellations: makeOfficialMetric(operational?.cancellations || 0, previousOperational?.cancellations || 0, operationAvailable),
    investment: makeOfficialMetric(investmentTotal, previousInvestmentTotal, true, investmentTotal),
    roi: makeOfficialMetric(0, 0, false),
    leads: makeOfficialMetric(meta?.leads || 0, previousMeta?.leads || 0, marketingAvailable),
    appointments: makeOfficialMetric(0, 0, false),
    sales: makeOfficialMetric(netNew, previousNetNew, operationAvailable),
    cac: makeOfficialMetric(cac, previousCac, operationAvailable),
    nps: makeOfficialMetric(0, 0, false),
  };
  const metricValue = (value: number | undefined) =>
    value === undefined ? "" : value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const metrics: MetricItem[] = [
    { id: "impr", checked: marketingAvailable, label: "Impressões", category: "Meta Ads", value: metricValue(meta?.impressions), unit: "imp." },
    { id: "clic", checked: marketingAvailable, label: "Cliques", category: "Meta Ads", value: metricValue(meta?.linkClicks), unit: "cliques" },
    { id: "ctr", checked: marketingAvailable, label: "CTR", category: "Meta Ads", value: metricValue(meta ? (meta.linkClicks / meta.impressions) * 100 : undefined), unit: "%" },
    { id: "cpc", checked: marketingAvailable, label: "CPC", category: "Meta Ads", value: metricValue(meta ? meta.investment / meta.linkClicks : undefined), unit: "R$" },
    { id: "leads_canal", checked: marketingAvailable, label: "Leads por Canal", category: "Meta Ads", value: metricValue(meta?.leads), unit: "leads" },
    { id: "conv_canal", checked: operationAvailable, label: "Novas aquisições", category: "Operacional", value: metricValue(operational?.netNew), unit: "benef." },
    { id: "agend", checked: false, label: "Agendamentos", category: "Indisponível", value: "", unit: "" },
    { id: "vendas_canal", checked: operationAvailable, label: "Entradas", category: "Operacional", value: metricValue(operational?.entries), unit: "benef." },
  ];
  const operationDocument = officialOperationalData(month);
  const warnings = [
    ...(statuses.marketing === "review" ? ["Os dados de Meta Ads desta competência exigem revisão."] : []),
    ...(statuses.operational === "not_sent" ? ["Os dados operacionais desta competência não foram enviados."] : []),
    ...(statuses.marketing === "not_sent" ? ["Os dados de marketing desta competência não foram enviados."] : []),
    ...(statuses.investment === "projected" ? ["Os investimentos desta competência são projeções recorrentes."] : []),
    "ROI, NPS e agendamentos permanecem indisponíveis por ausência de base confirmada.",
  ];

  return {
    month: requestedMonth,
    dataVersion: OFFICIAL_DASHBOARD_SOURCE_VERSION,
    summary,
    beneficiariesData: {
      evolution: getOfficialBeneficiaryEvolution()
        .filter((item, itemIndex) => itemIndex <= Math.min(index, 5))
        .map((item, itemIndex) => ({ date: `2026-${String(itemIndex + 1).padStart(2, "0")}`, count: item.ending })),
      distribution: OFFICIAL_CITIES.map((city) => ({ plan: city, count: operational?.entriesByCity[city] || 0 })),
      cityMovement: operationDocument?.entriesByCity.map((city) => ({ city: city.cityName, entries: city.entries, cancellations: city.cancellations })),
    },
    funnelData: [
      { stage: "Leads", count: meta?.leads || 0 },
      { stage: "Contatos", count: 0 },
      { stage: "Agendamentos", count: 0 },
      { stage: "Vendas", count: netNew },
    ],
    npsData: [],
    financialData: { revenue: null },
    npsSurvey: { promoters: null, passives: null, detractors: null },
    investments: investmentItems,
    metrics,
    metaAdsCampaigns: getOfficialMetaAdsCampaigns(month),
    operationalData: operationDocument,
    cancellationReasons: Object.entries(operational?.cancellationReasons || {}).map(([reason, count]) => ({ reason, count })),
    dataQuality: {
      source: "BASE-DADOS-DASHBOARD-UNIODONTO-2026.xlsx",
      sourceVersion: OFFICIAL_DASHBOARD_SOURCE_VERSION,
      operationalStatus: statuses.operational,
      marketingStatus: statuses.marketing,
      investmentStatus: statuses.investment,
      netNewSales: operational?.netNew,
      warnings,
      assumptions: ["Total de beneficiários de janeiro de 2026 fixado em 10.289; a evolução acumulada começa em fevereiro."],
    },
  };
};

const monthDocRef = (month: MonthKey) => {
  const monthId = month.replace(/\//g, "-");
  return doc(db, "organizations", "uniodonto", "months", monthId);
};

const normalizeDocument = (
  month: MonthKey,
  data: DocumentData | undefined | null,
): MonthlyDashboardDocument => {
  const fallback = buildMonthlyDocument(month);
  if (!data || data.dataVersion !== OFFICIAL_DATA_VERSION) return fallback;

  const rawBeneficiaries = data.beneficiariesData ?? fallback.beneficiariesData;
  const rawDistribution = Array.isArray(rawBeneficiaries.distribution)
    ? rawBeneficiaries.distribution
    : fallback.beneficiariesData.distribution;
  const normalizedBeneficiaries = {
    ...fallback.beneficiariesData,
    ...rawBeneficiaries,
    distribution: OFFICIAL_CITIES.map((city, index) => {
      const matching = rawDistribution.find((item: { plan?: string }) => item.plan === city);
      return { plan: city, count: Number(matching?.count ?? rawDistribution[index]?.count) || 0 };
    }),
  };
  const normalizedSummary = Object.fromEntries(
    (Object.keys(fallback.summary) as Array<keyof SummaryData>).map((key) => [
      key,
      {
        ...fallback.summary[key],
        ...(data.summary?.[key] ?? {}),
      },
    ]),
  ) as unknown as SummaryData;

  return {
    ...fallback,
    ...data,
    month,
    dataVersion: OFFICIAL_DATA_VERSION,
    // Merge each metric with the canonical definition. Besides supporting
    // older records, this restores semantic flags such as `available: false`
    // that must not be interpreted as a measured zero.
    summary: normalizedSummary,
    beneficiariesData: normalizedBeneficiaries,
    funnelData: data.funnelData ?? fallback.funnelData,
    npsData: data.npsData ?? fallback.npsData,
    financialData: {
      ...fallback.financialData,
      ...(data.financialData ?? {}),
    },
    npsSurvey: {
      ...fallback.npsSurvey,
      ...(data.npsSurvey ?? {}),
    },
    // Older future-month documents may exist with empty arrays. Treat those
    // as uninitialized so the month receives the previous period baseline.
    investments:
      Array.isArray(data.investments) && data.investments.length > 0
        ? data.investments
        : fallback.investments,
    metrics:
      Array.isArray(data.metrics) && data.metrics.length > 0
        ? data.metrics
        : fallback.metrics,
    metaAdsCampaigns: Array.isArray(data.metaAdsCampaigns) && data.metaAdsCampaigns.length > 0
      ? data.metaAdsCampaigns
      : fallback.metaAdsCampaigns,
    operationalData: data.operationalData,
    dataQuality: data.dataQuality ?? fallback.dataQuality,
    cancellationReasons:
      data.cancellationReasons ?? fallback.cancellationReasons,
  } as MonthlyDashboardDocument;
};

const normalizeInvestmentSummary = (
  record: MonthlyDashboardDocument,
): MonthlyDashboardDocument => {
  const investmentTotal = calculateInvestmentTotal(record.investments);
  const salesCurrent = record.dataQuality?.netNewSales ?? record.summary.sales.current;
  const cacCurrent =
    salesCurrent > 0 ? Number((investmentTotal / salesCurrent).toFixed(2)) : 0;
  const roiCurrent = calculateRoiPercent(record.financialData?.revenue, investmentTotal);
  const npsCurrent = calculateNpsScore(record.npsSurvey);
  return {
    ...record,
    summary: {
      ...record.summary,
      investment: {
        ...record.summary.investment,
        current: investmentTotal,
        previous: record.summary.investment.previous,
        target: record.summary.investment.target,
        variation:
          record.summary.investment.previous === 0
            ? 0
            : Number(
                (
                  ((investmentTotal - record.summary.investment.previous) /
                    record.summary.investment.previous) *
                  100
                ).toFixed(1),
              ),
      },
      cac: {
        ...record.summary.cac,
        current: cacCurrent,
        available: salesCurrent > 0,
        variation:
          record.summary.cac.previous === 0
            ? 0
            : Number(
                (
                  ((cacCurrent - record.summary.cac.previous) /
                    record.summary.cac.previous) *
                  100
                ).toFixed(1),
              ),
      },
      roi: {
        ...record.summary.roi,
        current: roiCurrent ?? 0,
        available: roiCurrent !== null,
        variation:
          roiCurrent === null || record.summary.roi.previous === 0
            ? 0
            : Number((((roiCurrent - record.summary.roi.previous) / record.summary.roi.previous) * 100).toFixed(1)),
      },
      nps: {
        ...record.summary.nps,
        current: npsCurrent ?? 0,
        available: npsCurrent !== null,
        variation:
          npsCurrent === null
            ? 0
            : Number((npsCurrent - Number(record.summary.nps.previous || 0)).toFixed(1)),
      },
    },
  };
};

export const applyOperationalDataToDocument = (
  record: MonthlyDashboardDocument,
  operationalData: MonthlyOperationalData,
): MonthlyDashboardDocument => {
  const entries = Number.isFinite(operationalData.entries) ? operationalData.entries : 0;
  const cancellations = Number.isFinite(operationalData.cancellations) ? operationalData.cancellations : 0;
  const cityMovement = operationalData.entriesByCity.map((city) => ({
    city: city.cityName,
    entries: city.entries,
    cancellations: city.cancellations,
  }));
  const cancellationReasons = operationalData.cancellationReasons.map((item) => ({
    reason: (item.reasonOriginal as MonthlyDashboardDocument["cancellationReasons"][number]["reason"]),
    count: item.quantity,
  }));

  return normalizeInvestmentSummary({
    ...record,
    month: operationalMonthKeyForDocument(operationalData),
    operationalData,
    summary: {
      ...record.summary,
      additions: { ...record.summary.additions, current: entries },
      cancellations: { ...record.summary.cancellations, current: cancellations },
      beneficiaries: {
        ...record.summary.beneficiaries,
        current: Number(record.summary.beneficiaries.previous || 0) + entries - cancellations,
      },
    },
    beneficiariesData: {
      ...record.beneficiariesData,
      cityMovement,
    },
    cancellationReasons: cancellationReasons.length > 0
      ? cancellationReasons
      : record.cancellationReasons,
    dataQuality: {
      ...(record.dataQuality ?? {
        source: operationalData.source.fileName,
        sourceVersion: OFFICIAL_DATA_VERSION,
        operationalStatus: "actual",
        marketingStatus: "unavailable",
        investmentStatus: "actual",
        warnings: [],
        assumptions: [],
      }),
      operationalStatus: operationalData.status === "complete" ? "actual" : operationalData.status,
      source: operationalData.source.fileName,
    },
  });
};

const operationalMonthKeyForDocument = (operationalData: MonthlyOperationalData): MonthKey => {
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${monthNames[operationalData.month - 1] || "Janeiro"}/${operationalData.year}`;
};

export const getDefaultMonthlyDashboard = buildMonthlyDocument;

export const getMonthKey = (month?: string | null) => month || DEFAULT_MONTH;
export const getPeriodLabel = (month?: string | null) =>
  month === "Todos" ? "Todos os meses" : getMonthKey(month);
export const getCurrentMonthKey = () => {
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
  const now = new Date();
  return `${monthNames[now.getMonth()]}/${now.getFullYear()}`;
};
const localMonthKey = (month: MonthKey) =>
  `uniodonto_monthly_dashboard_${month}`;

export const loadLocalMonthlyDashboard = (
  month: MonthKey,
): MonthlyDashboardDocument | null => {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(localMonthKey(month));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MonthlyDashboardDocument;
    return parsed.dataVersion === OFFICIAL_DATA_VERSION
      ? normalizeInvestmentSummary(normalizeDocument(month, parsed as unknown as DocumentData))
      : null;
  } catch {
    return null;
  }
};

export const OFFICIAL_DATA_VERSION = OFFICIAL_DASHBOARD_SOURCE_VERSION;

/**
 * Remove caches criados antes da planilha de investimentos se tornar a fonte
 * oficial. Mantém autenticação, preferências e demais dados do navegador.
 */
export const clearLegacyMonthlyDashboardCache = () => {
  if (typeof localStorage === "undefined") return;
  const versionKey = "uniodonto_monthly_dashboard_version";
  if (localStorage.getItem(versionKey) === OFFICIAL_DATA_VERSION) return;

  const legacyKeys = Array.from({ length: localStorage.length }, (_, index) =>
    localStorage.key(index),
  ).filter((key): key is string =>
    Boolean(key?.startsWith("uniodonto_monthly_dashboard_")),
  );
  legacyKeys.forEach((key) => localStorage.removeItem(key));

  localStorage.setItem(versionKey, OFFICIAL_DATA_VERSION);
};
export const loadMonthlyDashboard = async (
  month: MonthKey,
): Promise<MonthlyDashboardDocument> => {
  const snap = await getDoc(monthDocRef(month));
  if (!snap.exists()) {
    throw new Error(
      `Dados do mês "${month}" ainda não foram sincronizados no Firestore.`,
    );
  }

  return normalizeInvestmentSummary(normalizeDocument(month, snap.data()));
};

export const saveMonthlyDashboard = async (
  month: MonthKey,
  data: MonthlyDashboardDocument,
  user?: AppUserProfile | null,
) => {
  const payload = {
    ...data,
    month,
    dataVersion: OFFICIAL_DATA_VERSION,
    updatedAt: new Date().toISOString(),
    updatedBy: user ?? null,
  };

  const normalizedPayload = normalizeInvestmentSummary(payload);
  const firestorePayload = stripUndefinedFields(normalizedPayload);

  try {
    await setDoc(
      monthDocRef(month),
      {
        ...firestorePayload,
        month,
        updatedAt: serverTimestamp(),
        updatedBy: user ?? null,
      },
      { merge: true },
    );
    localStorage.setItem(localMonthKey(month), JSON.stringify(normalizedPayload));
    return { localSaved: true, remoteSaved: true };
  } catch (error) {
    // The local copy remains available, but callers must know that the
    // production database did not accept the write.
    console.error(
      "[dashboard] Falha ao sincronizar o mês com o Firestore",
      error,
    );
    localStorage.setItem(localMonthKey(month), JSON.stringify(normalizedPayload));
    return {
      localSaved: true,
      remoteSaved: false,
      error:
        error instanceof Error
          ? error
          : new Error("Falha ao salvar os dados do mês no Firestore."),
    };
  }
};

export const stripUndefinedFields = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedFields(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, stripUndefinedFields(item)]),
    ) as T;
  }
  return value;
};

export const subscribeMonthlyDashboard = (
  month: MonthKey,
  handler: MonthlyDashboardSnapshotHandler,
) => {
  let disposed = false;
  let unsubscribeRemote = () => undefined;

  // On a hard reload Firebase restores the persisted user asynchronously.
  // Waiting for that hydration prevents a valid session from being treated as
  // unauthenticated and permanently falling back to the browser cache.
  void auth.authStateReady()
    .then(() => {
      if (disposed) return;
      if (!auth.currentUser) {
        handler(null, new Error("Usuário não autenticado no Firebase."));
        return;
      }

      unsubscribeRemote = onSnapshot(
        monthDocRef(month),
        (snap) => {
          if (!snap.exists()) {
            handler(
              null,
              new Error(
                `Dados do mês "${month}" ainda não foram sincronizados no Firestore.`,
              ),
            );
            return;
          }

          if (snap.data().dataVersion !== OFFICIAL_DATA_VERSION) {
            handler(
              buildMonthlyDocument(month),
              new Error(`A competência "${month}" precisa ser migrada para a base oficial atual.`),
            );
            return;
          }

          const normalized = normalizeDocument(month, snap.data());
          // Firestore is authoritative when a remote document exists. The
          // local copy is only a fallback while the database is unavailable.
          handler(normalized);
        },
        (error) => {
          handler(
            null,
            error instanceof Error
              ? error
              : new Error("Falha ao ler o dashboard mensal no Firestore."),
          );
        },
      );
    })
    .catch((error) => {
      if (!disposed) {
        handler(
          null,
          error instanceof Error
            ? error
            : new Error("Falha ao restaurar a autenticação do Firebase."),
        );
      }
    });

  return () => {
    disposed = true;
    unsubscribeRemote();
  };
};

export const aggregateMonthlyDashboards = (
  records: MonthlyDashboardDocument[],
): MonthlyDashboardDocument => {
  const ordered = records
    .slice()
    .sort((a, b) => getOfficialMonthIndex(a.month) - getOfficialMonthIndex(b.month));
  const operationalRecords = ordered.filter((record) => record.dataQuality?.operationalStatus === "actual" || record.dataQuality?.operationalStatus === "partial");
  const marketingRecords = ordered.filter((record) => record.dataQuality?.marketingStatus === "actual" || record.dataQuality?.marketingStatus === "review");
  const investmentRecords = ordered.filter((record) => record.dataQuality?.investmentStatus === "actual");
  const financialRecords = ordered.filter((record) => Number(record.financialData?.revenue) >= 0 && record.financialData?.revenue !== null);
  const surveyRecords = ordered.filter((record) => calculateNpsScore(record.npsSurvey) !== null);
  const sumMetric = (items: MonthlyDashboardDocument[], key: keyof SummaryData) =>
    items.reduce((sum, record) => sum + (record.summary[key].available === false ? 0 : Number(record.summary[key].current) || 0), 0);
  const totalInvestment = sumMetric(investmentRecords, "investment");
  const totalNetNew = operationalRecords.reduce((sum, record) => sum + (record.dataQuality?.netNewSales || 0), 0);
  const latestOperational = operationalRecords.at(-1);
  const base = buildMonthlyDocument("Todos");
  const reasonTotals = new Map<string, number>();
  operationalRecords.forEach((record) => record.cancellationReasons.forEach((item) => {
    reasonTotals.set(item.reason, (reasonTotals.get(item.reason) || 0) + item.count);
  }));
  return normalizeInvestmentSummary({
    ...base,
    month: "Todos",
    summary: {
      beneficiaries: makeOfficialMetric(latestOperational?.summary.beneficiaries.current || 0, 0, Boolean(latestOperational)),
      additions: makeOfficialMetric(sumMetric(operationalRecords, "additions"), 0, operationalRecords.length > 0),
      cancellations: makeOfficialMetric(sumMetric(operationalRecords, "cancellations"), 0, operationalRecords.length > 0),
      investment: makeOfficialMetric(totalInvestment, 0, investmentRecords.length > 0, totalInvestment),
      roi: makeOfficialMetric(0, 0, false),
      leads: makeOfficialMetric(sumMetric(marketingRecords, "leads"), 0, marketingRecords.length > 0),
      appointments: makeOfficialMetric(0, 0, false),
      sales: makeOfficialMetric(totalNetNew, 0, totalNetNew > 0),
      cac: makeOfficialMetric(totalNetNew > 0 ? Number((totalInvestment / totalNetNew).toFixed(2)) : 0, 0, totalNetNew > 0),
      nps: makeOfficialMetric(0, 0, false),
    },
    investments: investmentRecords.flatMap((record) => record.investments),
    metrics: marketingRecords.flatMap((record) => record.metrics),
    metaAdsCampaigns: marketingRecords.flatMap((record) => record.metaAdsCampaigns || []),
    financialData: {
      revenue: financialRecords.length
        ? financialRecords.reduce((sum, record) => sum + Number(record.financialData?.revenue || 0), 0)
        : null,
    },
    npsSurvey: surveyRecords.length
      ? surveyRecords.reduce<NpsSurveyData>((total, record) => ({
          promoters: Number(total.promoters || 0) + Number(record.npsSurvey?.promoters || 0),
          passives: Number(total.passives || 0) + Number(record.npsSurvey?.passives || 0),
          detractors: Number(total.detractors || 0) + Number(record.npsSurvey?.detractors || 0),
        }), { promoters: 0, passives: 0, detractors: 0 })
      : { promoters: null, passives: null, detractors: null },
    operationalData: undefined,
    cancellationReasons: Array.from(reasonTotals, ([reason, count]) => ({ reason, count })),
    dataQuality: {
      source: "BASE-DADOS-DASHBOARD-UNIODONTO-2026.xlsx",
      sourceVersion: OFFICIAL_DATA_VERSION,
      operationalStatus: operationalRecords.length ? "actual" : "not_sent",
      marketingStatus: marketingRecords.length ? "actual" : "not_sent",
      investmentStatus: investmentRecords.length ? "actual" : "not_sent",
      netNewSales: totalNetNew,
      warnings: ["O consolidado considera somente competências realizadas; projeções não entram nos totais."],
      assumptions: ["Total de beneficiários de janeiro de 2026 fixado em 10.289; a evolução acumulada começa em fevereiro."],
    },
  });
};

export const getOfficialDashboardRecords = () =>
  OFFICIAL_MONTHS_2026.map((month) => buildMonthlyDocument(month));

export const subscribeAllMonthlyDashboards = (handler: MonthlyDashboardSnapshotHandler) => {
  let disposed = false;
  let unsubscribeRemote = () => undefined;

  void auth.authStateReady()
    .then(() => {
      if (disposed) return;
      if (!auth.currentUser) {
        handler(
          aggregateMonthlyDashboards(getOfficialDashboardRecords()),
          new Error("Usuário não autenticado no Firebase."),
        );
        return;
      }
      unsubscribeRemote = onSnapshot(
        collection(db, "organizations", "uniodonto", "months"),
        (snapshot) => {
          const remoteByMonth = new Map(snapshot.docs.map((item) => [String(item.data().month || item.id.replace("-", "/")), item.data()]));
          const records = OFFICIAL_MONTHS_2026.map((month) => {
            const remote = remoteByMonth.get(month);
            return remote?.dataVersion === OFFICIAL_DATA_VERSION
              ? normalizeDocument(month, remote)
              : buildMonthlyDocument(month);
          });
          handler(aggregateMonthlyDashboards(records));
        },
        (error) => handler(aggregateMonthlyDashboards(getOfficialDashboardRecords()), error),
      );
    })
    .catch((error) => {
      if (!disposed) {
        handler(
          aggregateMonthlyDashboards(getOfficialDashboardRecords()),
          error instanceof Error
            ? error
            : new Error("Falha ao restaurar a autenticação do Firebase."),
        );
      }
    });

  return () => {
    disposed = true;
    unsubscribeRemote();
  };
};

export const buildSummaryFromRecord = (
  record: MonthlyDashboardDocument,
): SummaryData => record.summary;
export const buildBeneficiariesFromRecord = (
  record: MonthlyDashboardDocument,
): BeneficiariesData => record.beneficiariesData;
export const buildFunnelFromRecord = (
  record: MonthlyDashboardDocument,
): FunnelDataPoint[] => record.funnelData;
export const buildNpsFromRecord = (
  record: MonthlyDashboardDocument,
): NpsDataPoint[] => record.npsData;

export const buildRecordFromEnvioState = (payload: {
  summary: SummaryData;
  beneficiariesData?: BeneficiariesData;
  funnelData?: FunnelDataPoint[];
  npsData?: NpsDataPoint[];
  financialData?: FinancialData;
  npsSurvey?: NpsSurveyData;
  investments: InvestmentItem[];
  metrics: MetricItem[];
  metaAdsCampaigns?: MetaAdsCampaign[];
  operationalData?: MonthlyOperationalData;
  cancellationReasons?: MonthlyDashboardDocument["cancellationReasons"];
  dataQuality?: MonthlyDashboardDocument["dataQuality"];
  month: MonthKey;
}): MonthlyDashboardDocument =>
  normalizeInvestmentSummary({
    month: payload.month,
    dataVersion: OFFICIAL_DATA_VERSION,
    summary: payload.summary,
    beneficiariesData:
      payload.beneficiariesData ??
      buildMonthlyDocument(payload.month).beneficiariesData,
    funnelData:
      payload.funnelData ?? buildMonthlyDocument(payload.month).funnelData,
    npsData: payload.npsData ?? buildMonthlyDocument(payload.month).npsData,
    financialData: payload.financialData ?? buildMonthlyDocument(payload.month).financialData,
    npsSurvey: payload.npsSurvey ?? buildMonthlyDocument(payload.month).npsSurvey,
    investments: payload.investments,
    metrics: payload.metrics,
    metaAdsCampaigns: payload.metaAdsCampaigns || [],
    operationalData: payload.operationalData,
    dataQuality: payload.dataQuality ?? buildMonthlyDocument(payload.month).dataQuality,
    cancellationReasons:
      payload.cancellationReasons ??
      buildMonthlyDocument(payload.month).cancellationReasons,
  });

export const defaultMonthlyDashboard = buildMonthlyDocument(DEFAULT_MONTH);
