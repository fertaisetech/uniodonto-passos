import type { MetaAdsCampaign, MonthKey } from "./dashboardData";
import { OFFICIAL_META_2026, type OfficialMonth2026 } from "./officialDashboard2026Data";

export interface OfficialMetaAdsMonthlyInput {
  investment: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  leads: number;
}

export const officialMetaAdsMonthlyData = OFFICIAL_META_2026;

export const getOfficialMetaAdsCampaigns = (month: MonthKey): MetaAdsCampaign[] => {
  const input = OFFICIAL_META_2026[month as OfficialMonth2026];
  if (!input) return [];

  return [{
    id: `meta-planilha-${month.replace(/\W/g, "-")}`,
    channel: "Meta",
    competence: month,
    dataMode: "actual",
    campaignName: "Meta Ads — Consolidado mensal",
    campaignId: `planilha-${month.replace(/\W/g, "-")}`,
    investment: input.investment,
    impressions: input.impressions,
    reach: input.reach,
    linkClicks: input.linkClicks,
    leads: input.leads,
    pageViews: null,
    lastUpdated: "2026-08-11",
    notes: input.status === "review"
      ? "Importado da base oficial; competência marcada para revisão."
      : "Importado da base oficial consolidada.",
    active: true,
  }];
};
