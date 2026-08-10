import { useEffect, useState } from "react";
import {
  clearLegacyMonthlyDashboardCache,
  getDefaultMonthlyDashboard,
  getMonthKey,
  loadLocalMonthlyDashboard,
  subscribeMonthlyDashboard,
  type MonthlyDashboardDocument,
} from "../lib/dashboardData";

const MONTHS_2026 = [
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
].map((month) => `${month}/2026`);

const readAllLocalMonths = (): MonthlyDashboardDocument[] =>
  MONTHS_2026.flatMap((month) => {
    try {
      const raw = localStorage.getItem(`uniodonto_monthly_dashboard_${month}`);
      return raw ? [JSON.parse(raw) as MonthlyDashboardDocument] : [];
    } catch {
      return [];
    }
  });

const aggregateLocalMonths = (
  records: MonthlyDashboardDocument[],
): MonthlyDashboardDocument | null => {
  if (records.length === 0) return null;
  const base = getDefaultMonthlyDashboard("Todos");
  const sum = (key: keyof MonthlyDashboardDocument["summary"]) =>
    records.reduce(
      (total, record) => total + (Number(record.summary[key]?.current) || 0),
      0,
    );
  return {
    ...base,
    month: "Todos",
    summary: {
      ...base.summary,
      beneficiaries: {
        ...base.summary.beneficiaries,
        current: records.at(-1)?.summary.beneficiaries.current || 0,
      },
      additions: { ...base.summary.additions, current: sum("additions") },
      cancellations: {
        ...base.summary.cancellations,
        current: sum("cancellations"),
      },
      investment: { ...base.summary.investment, current: sum("investment") },
      leads: { ...base.summary.leads, current: sum("leads") },
      appointments: {
        ...base.summary.appointments,
        current: sum("appointments"),
      },
      sales: { ...base.summary.sales, current: sum("sales") },
      nps: {
        ...base.summary.nps,
        current: records.at(-1)?.summary.nps.current || 0,
      },
      cac: {
        ...base.summary.cac,
        current: sum("investment") / Math.max(1, sum("leads")),
      },
      roi: {
        ...base.summary.roi,
        current:
          sum("investment") > 0 ? (sum("sales") / sum("investment")) * 100 : 0,
      },
    },
    investments: records.flatMap((record) => record.investments || []),
    metrics: records.flatMap((record) => record.metrics || []),
    metaAdsCampaigns: records.flatMap((record) => record.metaAdsCampaigns || []),
    cancellationReasons: base.cancellationReasons.map((reason) => ({
      ...reason,
      count: records.reduce(
        (total, record) =>
          total +
          (record.cancellationReasons.find(
            (item) => item.reason === reason.reason,
          )?.count || 0),
        0,
      ),
    })),
  };
};

export function useMonthlyDashboard(month?: string | null) {
  const monthKey = getMonthKey(month);
  const [data, setData] = useState<MonthlyDashboardDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDefaultData, setIsDefaultData] = useState(false);
  const hasData = true;

  useEffect(() => {
    let activeRequest = true;
    clearLegacyMonthlyDashboardCache();
    setLoading(true);
    setData(null);
    setError(null);
    setIsDefaultData(false);

    if (month === "Todos") {
      if (activeRequest) {
        setData(
          aggregateLocalMonths(readAllLocalMonths()) || {
            ...getDefaultMonthlyDashboard("Todos"),
            month: "Todos",
          },
        );
        setIsDefaultData(readAllLocalMonths().length === 0);
        setLoading(false);
      }
      return () => {
        activeRequest = false;
      };
    }

    const unsubscribe = subscribeMonthlyDashboard(
      monthKey,
      (next, nextError) => {
        if (!activeRequest) return;

        if (nextError) {
          const localData = loadLocalMonthlyDashboard(monthKey);
          setData(
            next || localData || {
              ...getDefaultMonthlyDashboard(monthKey),
              month: monthKey,
            },
          );
          setIsDefaultData(!next && !localData);
          setError(nextError.message || "Dados carregados localmente; ainda não sincronizados no Firestore");
          setLoading(false);
          return;
        }

        setData(next || { ...getDefaultMonthlyDashboard(monthKey), month: monthKey });
        setIsDefaultData(!next);
        setError(next ? null : "Dados carregados localmente; ainda não sincronizados no Firestore");
        setLoading(false);
      },
    );

    return () => {
      activeRequest = false;
      unsubscribe();
    };
  }, [month, monthKey]);

  return { data, loading, error, monthKey, hasData, isDefaultData };
}
