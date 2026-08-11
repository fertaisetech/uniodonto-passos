import {
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

export type MonthKey = string;

export interface SummaryMetric {
  current: number;
  previous: number;
  variation: number;
  target?: number;
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
    // A planilha não traz visualizações de página. Nesse caso, usamos
    // impressões como proxy explícito para o custo por visualização.
    costPerView:
      valid(investment) && valid(pageViews) && pageViews > 0
        ? investment / pageViews
        : valid(investment) && valid(impressions) && impressions > 0
          ? investment / impressions
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
  investments: InvestmentItem[];
  metrics: MetricItem[];
  metaAdsCampaigns?: MetaAdsCampaign[];
  operationalData?: MonthlyOperationalData;
  cancellationReasons: Array<{
    reason:
      | "CPF/CNPJ retornando"
      | "Cancelamento"
      | "Demissão"
      | "Pediu as contas"
      | "Mudança"
      | "Outros";
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

const makeMetric = (
  current: number,
  previousFactor = 0.95,
  targetFactor = 1.1,
): SummaryMetric => {
  const previous =
    current === 0 ? 0 : Number((current * previousFactor).toFixed(2));
  const target =
    current === 0 ? 0 : Number((current * targetFactor).toFixed(2));
  const variation =
    previous === 0
      ? 0
      : Number((((current - previous) / previous) * 100).toFixed(1));
  return { current, previous, variation, target };
};

const buildMonthlyDocument = (month: MonthKey): MonthlyDashboardDocument => {
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
  const [monthName, yearText] = month.split("/");
  const monthIndex = monthNames.indexOf(monthName);
  const year = Number(yearText) || 2026;
  const baseMonthIndex = 4;
  const monthDistance =
    monthIndex < 0 ? 0 : (year - 2026) * 12 + monthIndex - baseMonthIndex;
  const variationFactor = Number(Math.pow(1.05, monthDistance).toFixed(6));
  // New months start with the previous period's baseline so the integration
  // screen never opens empty when a new month begins. Users can then adjust
  // and save the real values for that month.
  const scale = (value: number) => Number((value * variationFactor).toFixed(2));
  const monthlyInvestmentValues = getMonthlyInvestmentValues(month);
  const investmentItems = baseInvestments.map((item) => ({
    ...item,
    value: monthlyInvestmentValues[item.id] ?? 0,
  }));
  const metricItems = baseMetrics.map((item) => {
    const numericValue = Number(
      item.value.replace(/[^0-9,-]/g, "").replace(",", "."),
    );
    if (!Number.isFinite(numericValue)) return { ...item, value: item.value };
    const scaledValue = scale(numericValue).toLocaleString("pt-BR", {
      maximumFractionDigits: 2,
    });
    return { ...item, value: scaledValue };
  });
  const investmentTotal = calculateInvestmentTotal(investmentItems);
  const salesCurrent = scale(86);
  const cacCurrent = Number((investmentTotal / salesCurrent).toFixed(2));
  const summary: SummaryData = {
    beneficiaries: makeMetric(scale(10289), 1.0, 1.05),
    additions: makeMetric(scale(42), 1.0, 1.1),
    cancellations: makeMetric(scale(18), 1.0, 1.0),
    investment: makeMetric(investmentTotal, 0.98, 1.1),
    roi: makeMetric(scale(819.69), 0.9, 1.15),
    leads: makeMetric(scale(420), 0.94, 1.1),
    appointments: makeMetric(scale(108), 0.92, 1.08),
    sales: makeMetric(salesCurrent, 0.93, 1.12),
    cac: makeMetric(cacCurrent, 0.91, 0.95),
    nps: makeMetric(scale(80), 0.95, 1.05),
  };
  const cancellationReasons = [
    { reason: "CPF/CNPJ retornando" as const, count: scale(3) },
    { reason: "Cancelamento" as const, count: scale(4) },
    { reason: "Demissão" as const, count: scale(3) },
    { reason: "Pediu as contas" as const, count: scale(2) },
    { reason: "Mudança" as const, count: scale(2) },
    { reason: "Outros" as const, count: scale(1) },
  ];

  const beneficiariesData: BeneficiariesData = {
    evolution: [
      { date: "2026-01", count: 10000 },
      { date: "2026-02", count: 10140 },
      { date: "2026-03", count: 10210 },
      { date: "2026-04", count: 10260 },
      { date: "2026-05", count: 10289 },
      { date: "2026-06", count: summary.beneficiaries.current },
    ],
    distribution: [
      { plan: "Passos", count: scale(4200) },
      { plan: "Itaú de Minas", count: scale(3889) },
      { plan: "S.S. Paraíso", count: scale(2200) },
      { plan: "Cássia", count: scale(1070) },
    ],
  };

  const funnelData: FunnelDataPoint[] = [
    { stage: "Leads", count: summary.leads.current },
    { stage: "Contatos", count: scale(300) },
    { stage: "Agendamentos", count: summary.appointments.current },
    { stage: "Vendas", count: summary.sales.current },
  ];

  const npsData: NpsDataPoint[] = [
    { date: "2026-01", score: 72 },
    { date: "2026-02", score: 74 },
    { date: "2026-03", score: 76 },
    { date: "2026-04", score: 78 },
    { date: "2026-05", score: 79 },
    { date: "2026-06", score: summary.nps.current },
  ];

  return {
    month,
    summary,
    beneficiariesData,
    funnelData,
    npsData,
    investments: investmentItems,
    metrics: metricItems,
    metaAdsCampaigns: getOfficialMetaAdsCampaigns(month),
    cancellationReasons,
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
  if (!data) return fallback;

  const rawBeneficiaries = data.beneficiariesData ?? fallback.beneficiariesData;
  const cityNames = ["Passos", "Itaú de Minas", "S.S. Paraíso", "Cássia"];
  const normalizedBeneficiaries = {
    ...fallback.beneficiariesData,
    ...rawBeneficiaries,
    distribution: (Array.isArray(rawBeneficiaries.distribution)
      ? rawBeneficiaries.distribution
      : fallback.beneficiariesData.distribution
    )
      .slice(0, cityNames.length)
      .map((item: { count?: number }, index: number) => ({
        plan: cityNames[index],
        count: Number(item.count) || 0,
      })),
  };

  return {
    ...fallback,
    ...data,
    month,
    dataVersion: data.dataVersion ?? OFFICIAL_DATA_VERSION,
    summary: data.summary ?? fallback.summary,
    beneficiariesData: normalizedBeneficiaries,
    funnelData: data.funnelData ?? fallback.funnelData,
    npsData: data.npsData ?? fallback.npsData,
    // Older future-month documents may exist with empty arrays. Treat those
    // as uninitialized so the month receives the previous period baseline.
    investments:
      data.dataVersion === OFFICIAL_DATA_VERSION &&
      Array.isArray(data.investments) &&
      data.investments.length > 0
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
    cancellationReasons:
      data.cancellationReasons ?? fallback.cancellationReasons,
  } as MonthlyDashboardDocument;
};

const normalizeInvestmentSummary = (
  record: MonthlyDashboardDocument,
): MonthlyDashboardDocument => {
  const investmentTotal = calculateInvestmentTotal(record.investments);
  const salesCurrent = record.summary.sales.current;
  const cacCurrent =
    salesCurrent > 0 ? Number((investmentTotal / salesCurrent).toFixed(2)) : 0;
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
    },
    beneficiariesData: {
      ...record.beneficiariesData,
      cityMovement,
    },
    cancellationReasons: cancellationReasons.length > 0
      ? cancellationReasons
      : record.cancellationReasons,
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
    return raw ? (JSON.parse(raw) as MonthlyDashboardDocument) : null;
  } catch {
    return null;
  }
};

export const OFFICIAL_DATA_VERSION = "investment-mensal-20260810";

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
  localStorage.setItem(localMonthKey(month), JSON.stringify(normalizedPayload));

  try {
    await setDoc(
      monthDocRef(month),
      {
        ...normalizedPayload,
        month,
        updatedAt: serverTimestamp(),
        updatedBy: user ?? null,
      },
      { merge: true },
    );
    return { localSaved: true, remoteSaved: true };
  } catch (error) {
    // The local copy remains available, but callers must know that the
    // production database did not accept the write.
    console.error(
      "[dashboard] Falha ao sincronizar o mês com o Firestore",
      error,
    );
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

export const subscribeMonthlyDashboard = (
  month: MonthKey,
  handler: MonthlyDashboardSnapshotHandler,
) => {
  // A local UI session without Firebase Auth cannot read Firestore. Avoid
  // opening a listener that will only generate permission errors. The
  // deterministic spreadsheet baseline remains available for editing.
  if (!auth.currentUser) {
    handler(null, new Error("Usuário não autenticado no Firebase."));
    return () => undefined;
  }

  const unsubscribeRemote = onSnapshot(
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

      const normalized = normalizeDocument(month, snap.data());
      // Firestore is authoritative when a remote document exists. The local
      // copy is only a fallback while the database is unavailable.
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

  return () => {
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
  investments: InvestmentItem[];
  metrics: MetricItem[];
  metaAdsCampaigns?: MetaAdsCampaign[];
  operationalData?: MonthlyOperationalData;
  cancellationReasons?: MonthlyDashboardDocument["cancellationReasons"];
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
    investments: payload.investments,
    metrics: payload.metrics,
    metaAdsCampaigns: payload.metaAdsCampaigns || [],
    operationalData: payload.operationalData,
    cancellationReasons:
      payload.cancellationReasons ??
      buildMonthlyDocument(payload.month).cancellationReasons,
  });

export const defaultMonthlyDashboard = buildMonthlyDocument(DEFAULT_MONTH);
