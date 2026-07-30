import { doc, getDoc, onSnapshot, setDoc, serverTimestamp, type DocumentData } from "firebase/firestore";
import { db, type AppUserProfile } from "./firebase";

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

export interface MonthlyDashboardDocument {
  month: MonthKey;
  summary: SummaryData;
  beneficiariesData: BeneficiariesData;
  funnelData: FunnelDataPoint[];
  npsData: NpsDataPoint[];
  investments: InvestmentItem[];
  metrics: MetricItem[];
  cancellationReasons: Array<{ reason: "Demissão" | "Desligamento" | "Cancelamento do usuário" | "Outro"; count: number }>;
  updatedAt?: unknown;
  updatedBy?: AppUserProfile | null;
}

type MonthlyDashboardSnapshotHandler = (
  data: MonthlyDashboardDocument | null,
  error?: Error | null
) => void;

const DEFAULT_MONTH = "Maio/2026";

const baseInvestments: InvestmentItem[] = [
  { id: "1", checked: true, source: "Rádio Vida (Passos)", category: "Offline", isFixed: false, value: 1750.0 },
  { id: "2", checked: true, source: "Rádio (Itaú de Minas)", category: "Offline", isFixed: false, value: 240.0 },
  { id: "3", checked: true, source: "Rádio (S. S. Paraíso)", category: "Offline", isFixed: false, value: 79.0 },
  { id: "4", checked: true, source: "Rádio (Cássia)", category: "Offline", isFixed: false, value: 271.0 },
  { id: "5", checked: true, source: "Jornal (Folha da Manhã)", category: "Offline", isFixed: false, value: 120.18 },
  { id: "6", checked: true, source: "Telão/Painel LED (Paraíso)", category: "Offline", isFixed: false, value: 400.0 },
  { id: "7", checked: true, source: "Meta (Facebook/Instagram)", category: "Ads", isFixed: false, value: 1242.0 },
  { id: "8", checked: true, source: "Google Ads", category: "Ads", isFixed: false, value: 800.0 },
  { id: "9", checked: true, source: "Agência de Marketing", category: "Marketing", isFixed: false, value: 2000.0 },
  { id: "10", checked: true, source: "RD Station (Mkt e Conversas)", category: "Software", isFixed: false, value: 1121.0 },
  { id: "11", checked: true, source: "RD Conversas", category: "Software", isFixed: false, value: 2087.28 },
  { id: "12", checked: true, source: "RD Marketing", category: "Software", isFixed: false, value: 1121.0 },
  { id: "13", checked: true, source: "RD CRM", category: "Software", isFixed: false, value: 786.0 },
  { id: "14", checked: true, source: "FerTaise", category: "Software", isFixed: false, value: 2000.0 },
];

const baseMetrics: MetricItem[] = [
  { id: "impr", checked: true, label: "Impressões", category: "TODOS", value: "150.000", unit: "imp." },
  { id: "clic", checked: true, label: "Cliques", category: "TODOS", value: "3.250", unit: "cliques" },
  { id: "ctr", checked: true, label: "CTR", category: "TODOS", value: "2,17", unit: "%" },
  { id: "cpc", checked: true, label: "CPC", category: "TODOS", value: "3,94", unit: "R$" },
  { id: "leads_canal", checked: true, label: "Leads por Canal", category: "TODOS", value: "420", unit: "leads" },
  { id: "conv_canal", checked: true, label: "Conversões por Canal", category: "TODOS", value: "86", unit: "vendas" },
  { id: "agend", checked: true, label: "Agendamentos", category: "TODOS", value: "108", unit: "agend." },
  { id: "vendas_canal", checked: true, label: "Vendas", category: "TODOS", value: "86", unit: "vendas" },
  { id: "camp_g1", checked: true, label: "Google Ads - Captação Passos", category: "Google Ads", value: "Clique", unit: "", isCustomCampaign: true },
  { id: "camp_g2", checked: true, label: "Google Ads - Plano Individual", category: "Google Ads", value: "Clique", unit: "", isCustomCampaign: true },
  { id: "camp_m1", checked: true, label: "Meta Ads - Conversão Convênio", category: "Meta Ads", value: "Clique", unit: "", isCustomCampaign: true },
  { id: "camp_m2", checked: true, label: "Meta Ads - Remarketing Família", category: "Meta Ads", value: "Clique", unit: "", isCustomCampaign: true },
];

export const calculateInvestmentTotal = (investments: InvestmentItem[]) =>
  Number(
    investments
      .filter((item) => item.checked)
      .reduce((acc, curr) => acc + curr.value, 0)
      .toFixed(2)
  );

const makeMetric = (current: number, previousFactor = 0.95, targetFactor = 1.1): SummaryMetric => {
  const previous = current === 0 ? 0 : Number((current * previousFactor).toFixed(2));
  const target = current === 0 ? 0 : Number((current * targetFactor).toFixed(2));
  const variation = previous === 0 ? 0 : Number((((current - previous) / previous) * 100).toFixed(1));
  return { current, previous, variation, target };
};

const buildMonthlyDocument = (month: MonthKey): MonthlyDashboardDocument => {
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const [monthName, yearText] = month.split("/");
  const monthIndex = monthNames.indexOf(monthName);
  const year = Number(yearText) || 2026;
  const baseMonthIndex = 4;
  const monthDistance = monthIndex < 0 ? 0 : (year - 2026) * 12 + monthIndex - baseMonthIndex;
  const isFutureMonth = monthDistance > 0;
  const variationFactor = Number(Math.pow(1.05, monthDistance).toFixed(6));
  const scale = (value: number) => Number((value * (isFutureMonth ? 0 : variationFactor)).toFixed(2));
  const investmentItems = isFutureMonth ? [] : baseInvestments.map((item) => ({ ...item, value: scale(item.value) }));
  const metricItems = isFutureMonth ? [] : baseMetrics.map((item) => {
    const numericValue = Number(item.value.replace(/[^0-9,-]/g, "").replace(",", "."));
    if (!Number.isFinite(numericValue)) return { ...item, value: isFutureMonth ? "" : item.value };
    const scaledValue = scale(numericValue).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
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
    { reason: "Demissão" as const, count: scale(6) },
    { reason: "Desligamento" as const, count: scale(5) },
    { reason: "Cancelamento do usuário" as const, count: scale(4) },
    { reason: "Outro" as const, count: scale(3) },
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
      { plan: "Premium", count: scale(4200) },
      { plan: "Standard", count: scale(3889) },
      { plan: "Basic", count: scale(2200) },
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
    cancellationReasons,
  };
};

const monthDocRef = (month: MonthKey) => {
  const monthId = month.replace(/\//g, "-");
  return doc(db, "organizations", "uniodonto", "months", monthId);
};

const normalizeDocument = (month: MonthKey, data: DocumentData | undefined | null): MonthlyDashboardDocument => {
  const fallback = buildMonthlyDocument(month);
  if (!data) return fallback;

  return {
    ...fallback,
    ...data,
    month,
    summary: data.summary ?? fallback.summary,
    beneficiariesData: data.beneficiariesData ?? fallback.beneficiariesData,
    funnelData: data.funnelData ?? fallback.funnelData,
    npsData: data.npsData ?? fallback.npsData,
    investments: data.investments ?? fallback.investments,
    metrics: data.metrics ?? fallback.metrics,
    cancellationReasons: data.cancellationReasons ?? fallback.cancellationReasons,
  } as MonthlyDashboardDocument;
};

const normalizeInvestmentSummary = (record: MonthlyDashboardDocument): MonthlyDashboardDocument => {
  const investmentTotal = calculateInvestmentTotal(record.investments);
  const salesCurrent = record.summary.sales.current;
  const cacCurrent = salesCurrent > 0 ? Number((investmentTotal / salesCurrent).toFixed(2)) : 0;
  return {
    ...record,
    summary: {
      ...record.summary,
      investment: {
        ...record.summary.investment,
        current: investmentTotal,
        previous: record.summary.investment.previous,
        target: record.summary.investment.target,
        variation: record.summary.investment.previous === 0
          ? 0
          : Number((((investmentTotal - record.summary.investment.previous) / record.summary.investment.previous) * 100).toFixed(1)),
      },
      cac: {
        ...record.summary.cac,
        current: cacCurrent,
        variation: record.summary.cac.previous === 0
          ? 0
          : Number((((cacCurrent - record.summary.cac.previous) / record.summary.cac.previous) * 100).toFixed(1)),
      },
    },
  };
};

export const getDefaultMonthlyDashboard = buildMonthlyDocument;

export const getMonthKey = (month?: string | null) => month || DEFAULT_MONTH;
export const getCurrentMonthKey = () => {
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const now = new Date();
  return `${monthNames[now.getMonth()]}/${now.getFullYear()}`;
};
const localMonthKey = (month: MonthKey) => `uniodonto_monthly_dashboard_${month}`;
const readLocalMonthlyDashboard = (month: MonthKey): MonthlyDashboardDocument | null => {
  try {
    const raw = localStorage.getItem(localMonthKey(month));
    return raw ? normalizeDocument(month, JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

export const loadMonthlyDashboard = async (month: MonthKey): Promise<MonthlyDashboardDocument> => {
  const snap = await getDoc(monthDocRef(month));
  if (!snap.exists()) {
    throw new Error(`Dados do mês "${month}" ainda não foram sincronizados no Firestore.`);
  }

  return normalizeInvestmentSummary(normalizeDocument(month, snap.data()));
};

export const saveMonthlyDashboard = async (
  month: MonthKey,
  data: MonthlyDashboardDocument,
  user?: AppUserProfile | null
) => {
  const payload = {
    ...data,
    month,
    updatedAt: new Date().toISOString(),
    updatedBy: user ?? null,
  };

  const normalizedPayload = normalizeInvestmentSummary(payload);
  localStorage.setItem(localMonthKey(month), JSON.stringify(normalizedPayload));

  try {
    await setDoc(monthDocRef(month), {
      ...normalizedPayload,
      month,
      updatedAt: serverTimestamp(),
      updatedBy: user ?? null,
    }, { merge: true });
    return { localSaved: true, remoteSaved: true };
  } catch (error) {
    // The local copy remains available, but callers must know that the
    // production database did not accept the write.
    console.error("[dashboard] Falha ao sincronizar o mês com o Firestore", error);
    return {
      localSaved: true,
      remoteSaved: false,
      error: error instanceof Error ? error : new Error("Falha ao salvar os dados do mês no Firestore."),
    };
  }
};

export const subscribeMonthlyDashboard = (
  month: MonthKey,
  handler: MonthlyDashboardSnapshotHandler
) => {
  const unsubscribeRemote = onSnapshot(
    monthDocRef(month),
    (snap) => {
      if (!snap.exists()) {
        handler(null, new Error(`Dados do mês "${month}" ainda não foram sincronizados no Firestore.`));
        return;
      }

      const normalized = normalizeDocument(month, snap.data());
      // Firestore is authoritative when a remote document exists. The local
      // copy is only a fallback while the database is unavailable.
      handler(normalized);
    },
    (error) => {
      handler(
        readLocalMonthlyDashboard(month),
        error instanceof Error ? error : new Error("Falha ao ler o dashboard mensal no Firestore.")
      );
    }
  );

  const localData = readLocalMonthlyDashboard(month);
  if (localData) handler(localData);

  return () => {
    unsubscribeRemote();
  };
};

export const buildSummaryFromRecord = (record: MonthlyDashboardDocument): SummaryData => record.summary;
export const buildBeneficiariesFromRecord = (record: MonthlyDashboardDocument): BeneficiariesData => record.beneficiariesData;
export const buildFunnelFromRecord = (record: MonthlyDashboardDocument): FunnelDataPoint[] => record.funnelData;
export const buildNpsFromRecord = (record: MonthlyDashboardDocument): NpsDataPoint[] => record.npsData;

export const buildRecordFromEnvioState = (payload: {
  summary: SummaryData;
  beneficiariesData?: BeneficiariesData;
  funnelData?: FunnelDataPoint[];
  npsData?: NpsDataPoint[];
  investments: InvestmentItem[];
  metrics: MetricItem[];
  month: MonthKey;
}): MonthlyDashboardDocument => normalizeInvestmentSummary({
  month: payload.month,
  summary: payload.summary,
  beneficiariesData: payload.beneficiariesData ?? buildMonthlyDocument(payload.month).beneficiariesData,
  funnelData: payload.funnelData ?? buildMonthlyDocument(payload.month).funnelData,
  npsData: payload.npsData ?? buildMonthlyDocument(payload.month).npsData,
  investments: payload.investments,
  metrics: payload.metrics,
  cancellationReasons: payload.cancellationReasons ?? buildMonthlyDocument(payload.month).cancellationReasons,
});

export const defaultMonthlyDashboard = buildMonthlyDocument(DEFAULT_MONTH);
