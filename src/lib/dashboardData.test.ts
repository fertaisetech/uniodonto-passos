import { describe, expect, it } from "vitest";
import {
  buildRecordFromEnvioState,
  calculateInvestmentTotal,
  defaultMonthlyDashboard,
  type InvestmentItem,
  type SummaryData,
} from "./dashboardData";

describe("dashboardData", () => {
  it("sums only checked investments", () => {
    const investments: InvestmentItem[] = [
      { id: "1", checked: true, source: "A", category: "Ads", isFixed: false, value: 10 },
      { id: "2", checked: false, source: "B", category: "Offline", isFixed: false, value: 50 },
      { id: "3", checked: true, source: "C", category: "Marketing", isFixed: false, value: 5.25 },
    ];

    expect(calculateInvestmentTotal(investments)).toBe(15.25);
  });

  it("normalizes investment totals and CAC when building a monthly record", () => {
    const summary: SummaryData = {
      ...defaultMonthlyDashboard.summary,
      sales: { current: 5, previous: 4, variation: 25, target: 6 },
      investment: { current: 1, previous: 1, variation: 0, target: 1 },
      cac: { current: 0, previous: 0, variation: 0, target: 0 },
    };

    const record = buildRecordFromEnvioState({
      month: "Junho/2026",
      summary,
      investments: [
        { id: "1", checked: true, source: "A", category: "Ads", isFixed: false, value: 10 },
        { id: "2", checked: true, source: "B", category: "Software", isFixed: false, value: 5.5 },
      ],
      metrics: defaultMonthlyDashboard.metrics,
      beneficiariesData: defaultMonthlyDashboard.beneficiariesData,
      funnelData: defaultMonthlyDashboard.funnelData,
      npsData: defaultMonthlyDashboard.npsData,
    });

    expect(record.summary.investment.current).toBe(15.5);
    expect(record.summary.cac.current).toBe(3.1);
    expect(record.month).toBe("Junho/2026");
  });
});
