import {
  OFFICIAL_INVESTMENTS_2026,
  OFFICIAL_MONTHS_2026,
  getOfficialInvestmentTotal,
  getOfficialInvestmentValues,
} from "./officialDashboard2026Data";

export type MonthlyInvestmentValues = Record<string, number>;

export const getMonthlyInvestmentValues = (month: string): MonthlyInvestmentValues => {
  if (month !== "Todos") return getOfficialInvestmentValues(month);
  return Object.fromEntries(
    OFFICIAL_INVESTMENTS_2026.map((item) => [
      item.id,
      Number(item.values.reduce((sum, value) => sum + value, 0).toFixed(2)),
    ]),
  );
};

export const getMonthlyInvestmentTotal = (month: string) =>
  month === "Todos"
    ? Number(OFFICIAL_MONTHS_2026.reduce((sum, item) => sum + getOfficialInvestmentTotal(item), 0).toFixed(2))
    : getOfficialInvestmentTotal(month);
