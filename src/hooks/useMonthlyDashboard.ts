import { useEffect, useState } from "react";
import {
  clearLegacyMonthlyDashboardCache,
  getDefaultMonthlyDashboard,
  getMonthKey,
  loadLocalMonthlyDashboard,
  subscribeAllMonthlyDashboards,
  subscribeMonthlyDashboard,
  type MonthlyDashboardDocument,
} from "../lib/dashboardData";

export function useMonthlyDashboard(month?: string | null) {
  const monthKey = getMonthKey(month);
  const [data, setData] = useState<MonthlyDashboardDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDefaultData, setIsDefaultData] = useState(false);

  useEffect(() => {
    let active = true;
    clearLegacyMonthlyDashboardCache();
    setLoading(true);
    setData(null);
    setError(null);
    setIsDefaultData(false);

    const handleResult = (
      next: MonthlyDashboardDocument | null,
      nextError?: Error | null,
    ) => {
      if (!active) return;
      if (next) {
        setData(next);
        setIsDefaultData(Boolean(nextError));
        setError(nextError?.message || null);
        setLoading(false);
        return;
      }
      const local = month !== "Todos" ? loadLocalMonthlyDashboard(monthKey) : null;
      setData(local || getDefaultMonthlyDashboard(month === "Todos" ? "Todos" : monthKey));
      setIsDefaultData(true);
      setError(nextError?.message || "Dados oficiais carregados localmente; sincronização remota pendente.");
      setLoading(false);
    };

    const unsubscribe = month === "Todos"
      ? subscribeAllMonthlyDashboards(handleResult)
      : subscribeMonthlyDashboard(monthKey, handleResult);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [month, monthKey]);

  const hasData = Boolean(data) && (
    month === "Todos" ||
    data?.dataQuality?.operationalStatus !== "not_sent" ||
    data?.dataQuality?.marketingStatus !== "not_sent" ||
    data?.dataQuality?.investmentStatus !== "not_sent"
  );

  return { data, loading, error, monthKey, hasData, isDefaultData };
}
