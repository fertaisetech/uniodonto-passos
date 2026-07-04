import { useEffect, useState } from "react";
import {
  getDefaultMonthlyDashboard,
  getMonthKey,
  subscribeMonthlyDashboard,
  type MonthlyDashboardDocument,
} from "../lib/dashboardData";

export function useMonthlyDashboard(month?: string | null) {
  const monthKey = getMonthKey(month);
  const [data, setData] = useState<MonthlyDashboardDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setError(null);

    const unsubscribe = subscribeMonthlyDashboard(monthKey, (next, nextError) => {
      if (nextError) {
        setData(getDefaultMonthlyDashboard(monthKey));
        setError(null);
        setLoading(false);
        return;
      }

      setData(next ?? getDefaultMonthlyDashboard(monthKey));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [monthKey]);

  return { data, loading, error, monthKey };
}
