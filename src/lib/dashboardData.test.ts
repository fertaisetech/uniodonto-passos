import { describe, expect, it } from "vitest";
import {
  buildRecordFromEnvioState,
  calculateInvestmentTotal,
  calculateMetaAdsMetrics,
  calculateNpsScore,
  calculateRoiPercent,
  stripUndefinedFields,
  buildMarketingFunnelData,
  clearLegacyMonthlyDashboardCache,
  defaultMonthlyDashboard,
  getDefaultMonthlyDashboard,
  getPeriodLabel,
  type InvestmentItem,
  type SummaryData,
} from "./dashboardData";
import { getMonthlyInvestmentTotal, getMonthlyInvestmentValues } from "./investmentMonthlyData";
import { getOfficialMetaAdsCampaigns } from "./metaAdsMonthlyData";

describe("dashboardData", () => {
  it("remove campos indefinidos antes de gravar no Firestore", () => {
    expect(
      stripUndefinedFields({
        summary: { current: 10, target: undefined },
        rows: [{ value: 1, note: undefined }],
      }),
    ).toEqual({ summary: { current: 10 }, rows: [{ value: 1 }] });
  });
  it("loads the official Meta leads by month and leaves unavailable months empty", () => {
    expect(getOfficialMetaAdsCampaigns("Julho/2026")[0]).toMatchObject({
      investment: 1226.35,
      impressions: 125019,
      reach: 27817,
      linkClicks: 1073,
      leads: 65,
      dataMode: "actual",
    });
    expect(getOfficialMetaAdsCampaigns("Agosto/2026")).toEqual([]);
  });

  it("does not present impressions as page views when page views are absent", () => {
    const metrics = calculateMetaAdsMetrics({
      investment: 1634.58,
      impressions: 121696,
      linkClicks: 743,
      pageViews: null,
    });
    expect(metrics.costPerView).toBeNull();
  });

  it("sums only checked investments", () => {
    const investments: InvestmentItem[] = [
      {
        id: "1",
        checked: true,
        source: "A",
        category: "Ads",
        isFixed: false,
        value: 10,
      },
      {
        id: "2",
        checked: false,
        source: "B",
        category: "Offline",
        isFixed: false,
        value: 50,
      },
      {
        id: "3",
        checked: true,
        source: "C",
        category: "Marketing",
        isFixed: false,
        value: 5.25,
      },
    ];

    expect(calculateInvestmentTotal(investments)).toBe(15.25);
  });

  it("keeps Todos as an explicit all-months period", () => {
    expect(getPeriodLabel("Todos")).toBe("Todos os meses");
    expect(getPeriodLabel("Maio/2026")).toBe("Maio/2026");
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
        {
          id: "1",
          checked: true,
          source: "A",
          category: "Ads",
          isFixed: false,
          value: 10,
        },
        {
          id: "2",
          checked: true,
          source: "B",
          category: "Software",
          isFixed: false,
          value: 5.5,
        },
      ],
      metrics: defaultMonthlyDashboard.metrics,
      beneficiariesData: defaultMonthlyDashboard.beneficiariesData,
      funnelData: defaultMonthlyDashboard.funnelData,
      npsData: defaultMonthlyDashboard.npsData,
      dataQuality: {
        ...defaultMonthlyDashboard.dataQuality!,
        netNewSales: 5,
      },
    });

    expect(record.summary.investment.current).toBe(15.5);
    expect(record.summary.cac.current).toBe(3.1);
    expect(record.month).toBe("Junho/2026");
  });

  it("uses the first spreadsheet tab for every monthly investment value", () => {
    expect(getMonthlyInvestmentValues("Maio/2026")["7"]).toBe(1366.1);
    expect(getMonthlyInvestmentValues("Agosto/2026")["14"]).toBe(1750);
    expect(getMonthlyInvestmentTotal("Janeiro/2026")).toBe(10282.38);
    expect(getMonthlyInvestmentTotal("Abril/2026")).toBe(12018.01);
    expect(getMonthlyInvestmentTotal("Maio/2026")).toBe(12013.9);
  });

  it("calculates Meta Ads traffic metrics from consolidated totals", () => {
    const metrics = calculateMetaAdsMetrics({
      investment: 1437,
      impressions: 248319,
      linkClicks: 6109,
      pageViews: 3097,
    });

    expect(metrics.ctr).toBeCloseTo(2.4597, 3);
    expect(metrics.cpc).toBeCloseTo(0.2352, 3);
    expect(metrics.cpm).toBeCloseTo(5.7869, 3);
    expect(metrics.costPerView).toBeCloseTo(0.464, 3);
    expect(metrics.clickToPageRate).toBeCloseTo(50.6957, 3);
  });

  it("uses the selected month's official Meta traffic in the conversion funnel", () => {
    const funnel = buildMarketingFunnelData({
      summary: {
        ...defaultMonthlyDashboard.summary,
        appointments: { current: 21, previous: 0, variation: 0 },
        sales: { current: 18, previous: 0, variation: 0 },
      },
      metrics: defaultMonthlyDashboard.metrics,
      metaAdsCampaigns: getOfficialMetaAdsCampaigns("Junho/2026"),
    });

    expect(funnel).toMatchObject({
      impressions: 128198,
      clicks: 1109,
      leads: 55,
      appointments: 21,
      sales: 18,
    });
  });

  it("falls back to the monthly saved metrics when Meta has no official record", () => {
    const funnel = buildMarketingFunnelData({
      summary: defaultMonthlyDashboard.summary,
      metrics: defaultMonthlyDashboard.metrics,
      metaAdsCampaigns: [],
    });

    expect(funnel.impressions).toBe(126754);
    expect(funnel.clicks).toBe(956);
    expect(funnel.leads).toBe(34);
  });

  it("uses the reconciled operational values and all six cities", () => {
    const april = getDefaultMonthlyDashboard("Abril/2026");
    expect(april.summary.additions.current).toBe(331);
    expect(april.summary.cancellations.current).toBe(258);
    expect(april.summary.sales.current).toBe(297);
    expect(april.summary.cac.current).toBeCloseTo(12018.01 / 297, 2);
    expect(april.operationalData?.entriesByCity).toHaveLength(6);
    expect(april.operationalData?.entriesByCity.reduce((sum, city) => sum + city.entries, 0)).toBe(331);
  });

  it("marks missing future operational data as not sent instead of fabricating values", () => {
    const august = getDefaultMonthlyDashboard("Agosto/2026");
    expect(august.summary.additions.available).toBe(false);
    expect(august.summary.additions.current).toBe(0);
    expect(august.operationalData).toBeUndefined();
    expect(august.dataQuality?.operationalStatus).toBe("not_sent");
    expect(august.dataQuality?.investmentStatus).toBe("projected");
  });

  it("does not fabricate Meta metrics when a denominator is zero or missing", () => {
    const metrics = calculateMetaAdsMetrics({
      investment: 1437.77,
      impressions: null,
      linkClicks: 0,
      pageViews: null,
    });

    expect(metrics.ctr).toBeNull();
    expect(metrics.cpc).toBeNull();
    expect(metrics.cpm).toBeNull();
    expect(metrics.costPerView).toBeNull();
    expect(metrics.clickToPageRate).toBeNull();
  });

  it("calcula o ROI somente quando receita e investimento são válidos", () => {
    expect(calculateRoiPercent(40_000, 10_000)).toBe(400);
    expect(calculateRoiPercent(null, 10_000)).toBeNull();
    expect(calculateRoiPercent(40_000, 0)).toBeNull();
  });

  it("calcula o NPS a partir das respostas e preserva dados indisponíveis", () => {
    expect(calculateNpsScore({ promoters: 80, passives: 10, detractors: 10 })).toBe(70);
    expect(calculateNpsScore({ promoters: null, passives: null, detractors: null })).toBeNull();
  });

  it("clears only the legacy monthly cache", () => {
    localStorage.setItem("uniodonto_monthly_dashboard_Agosto/2026", "old");
    localStorage.setItem("uniodonto_session", "keep");

    clearLegacyMonthlyDashboardCache();

    expect(localStorage.getItem("uniodonto_monthly_dashboard_Agosto/2026")).toBeNull();
    expect(localStorage.getItem("uniodonto_session")).toBe("keep");
  });

});
