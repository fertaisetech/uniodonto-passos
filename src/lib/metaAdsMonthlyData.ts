import type { MetaAdsCampaign, MonthKey } from "./dashboardData";

export interface OfficialMetaAdsMonthlyInput {
  investment: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  leads: number;
}

/** Dados oficiais informados na aba de marketing da planilha recebida. */
export const officialMetaAdsMonthlyData: Record<string, OfficialMetaAdsMonthlyInput> = {
  "Janeiro/2026": { investment: 1634.58, impressions: 121696, reach: 36487, linkClicks: 743, leads: 46 },
  "Fevereiro/2026": { investment: 1281.96, impressions: 148948, reach: 34366, linkClicks: 1314, leads: 41 },
  "Março/2026": { investment: 1436.41, impressions: 146901, reach: 48185, linkClicks: 1189, leads: 55 },
  "Abril/2026": { investment: 1370.21, impressions: 133556, reach: 37350, linkClicks: 1081, leads: 56 },
  "Maio/2026": { investment: 1366.10, impressions: 126754, reach: 35955, linkClicks: 956, leads: 34 },
  "Junho/2026": { investment: 1218.87, impressions: 128198, reach: 24579, linkClicks: 1109, leads: 55 },
  "Julho/2026": { investment: 1226.35, impressions: 125019, reach: 27817, linkClicks: 1073, leads: 65 },
};

export const getOfficialMetaAdsCampaigns = (month: MonthKey): MetaAdsCampaign[] => {
  const input = officialMetaAdsMonthlyData[month];
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
    lastUpdated: `${month.split("/")[1]}-${String(Object.keys(officialMetaAdsMonthlyData).indexOf(month) + 1).padStart(2, "0")}-28`,
    notes: "Importado da aba de marketing da planilha recebida.",
    active: true,
  }];
};
