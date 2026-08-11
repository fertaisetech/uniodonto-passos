export const OFFICIAL_MONTHS_2026 = [
  "Janeiro/2026",
  "Fevereiro/2026",
  "Março/2026",
  "Abril/2026",
  "Maio/2026",
  "Junho/2026",
  "Julho/2026",
  "Agosto/2026",
  "Setembro/2026",
  "Outubro/2026",
  "Novembro/2026",
  "Dezembro/2026",
] as const;

export type OfficialMonth2026 = (typeof OFFICIAL_MONTHS_2026)[number];
export type OfficialDataStatus =
  | "actual"
  | "partial"
  | "review"
  | "projected"
  | "not_sent"
  | "unavailable";

export const OFFICIAL_DASHBOARD_SOURCE_VERSION = "base-dashboard-uniodonto-2026-v1";
export const OPENING_BENEFICIARIES_JANUARY_2026 = 10289;

export const OFFICIAL_CITIES = [
  "Passos",
  "Itaú de Minas",
  "São Sebastião do Paraíso",
  "Pratápolis",
  "São João Batista do Glória",
  "Cássia",
] as const;

export interface OfficialInvestmentInput {
  id: string;
  source: string;
  category: "Ads" | "Software" | "Offline" | "Marketing";
  values: readonly number[];
}

export interface OfficialMetaInput {
  investment: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  leads: number;
  status: "actual" | "review";
}

export interface OfficialOperationalInput {
  entries: number;
  cancellations: number;
  netNew: number;
  entriesByCity: Record<string, number>;
  cancellationsByCity: Record<string, number>;
  cancellationReasons: Record<string, number>;
  status: "actual" | "partial";
}

const monthly = (...values: number[]) => values;

export const OFFICIAL_INVESTMENTS_2026: readonly OfficialInvestmentInput[] = [
  { id: "1", source: "Rádio Vida (Passos)", category: "Offline", values: monthly(1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5) },
  { id: "2", source: "Rádio (Itaú de Minas)", category: "Offline", values: monthly(240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240) },
  { id: "3", source: "Rádio (S. S. Paraíso)", category: "Offline", values: monthly(796, 796, 796, 796, 796, 796, 796, 796, 796, 796, 796, 796) },
  { id: "4", source: "Rádio (Cássia)", category: "Offline", values: monthly(185, 185, 185, 185, 185, 185, 185, 185, 185, 185, 185, 185) },
  { id: "5", source: "Jornal (Folha da Manhã)", category: "Offline", values: monthly(120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18) },
  { id: "6", source: "Telão/Painel LED (Paraíso)", category: "Offline", values: monthly(400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400) },
  { id: "9", source: "Agência de Marketing", category: "Marketing", values: monthly(1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58) },
  { id: "14", source: "FerTaise", category: "Software", values: monthly(0, 0, 0, 2000, 2000, 2000, 1750, 1750, 1750, 1750, 1750, 1750) },
  { id: "11", source: "RD Conversas", category: "Software", values: monthly(2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54) },
  { id: "13", source: "RD CRM", category: "Software", values: monthly(786, 786, 786, 786, 786, 786, 786, 786, 786, 786, 786, 786) },
  { id: "12", source: "RD Marketing", category: "Software", values: monthly(1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121) },
  { id: "7", source: "Meta (Facebook/Instagram)", category: "Ads", values: monthly(1634.58, 1281.96, 1436.41, 1370.21, 1366.1, 1218.87, 1226.35, 1370.21, 1370.21, 1370.21, 1370.21, 1370.21) },
  { id: "8", source: "Google Ads", category: "Ads", values: monthly(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0) },
] as const;

export const OFFICIAL_META_2026: Partial<Record<OfficialMonth2026, OfficialMetaInput>> = {
  "Janeiro/2026": { investment: 1634.58, impressions: 475706, reach: 108375, linkClicks: 3734, leads: 27, status: "review" },
  "Fevereiro/2026": { investment: 1281.96, impressions: 148948, reach: 34366, linkClicks: 1314, leads: 41, status: "actual" },
  "Março/2026": { investment: 1436.41, impressions: 146901, reach: 48185, linkClicks: 1189, leads: 55, status: "actual" },
  "Abril/2026": { investment: 1370.21, impressions: 133556, reach: 37350, linkClicks: 1081, leads: 56, status: "actual" },
  "Maio/2026": { investment: 1366.1, impressions: 126754, reach: 35955, linkClicks: 956, leads: 34, status: "actual" },
  "Junho/2026": { investment: 1218.87, impressions: 128198, reach: 24579, linkClicks: 1109, leads: 55, status: "actual" },
  "Julho/2026": { investment: 1226.35, impressions: 125019, reach: 27817, linkClicks: 1073, leads: 65, status: "actual" },
};

const operationalRows: Array<{
  entries: number;
  cancellations: number;
  netNew: number;
  cityEntries: number[];
  cityCancellations: number[];
  reasons: Record<string, number>;
}> = [
  { entries: 197, cancellations: 114, netNew: 172, cityEntries: [122, 19, 35, 19, 2, 0], cityCancellations: [75, 12, 19, 8, 0, 0], reasons: { "Saiu da empresa": 30, Desistência: 44, Demissão: 12, Outros: 12, "Continuidade afastamento": 9, "Continuidade Demissão": 6, Transferência: 1 } },
  { entries: 437, cancellations: 199, netNew: 389, cityEntries: [185, 205, 41, 6, 0, 0], cityCancellations: [96, 48, 49, 6, 0, 0], reasons: { "Saiu da empresa": 44, Desistência: 51, Demissão: 55, Outros: 29, "Continuidade afastamento": 12, Transferência: 4, "Afastamento INSS": 4 } },
  { entries: 271, cancellations: 212, netNew: 248, cityEntries: [158, 74, 36, 0, 3, 0], cityCancellations: [139, 47, 23, 3, 0, 0], reasons: { "Saiu da empresa": 95, Desistência: 67, Demissão: 31, Outros: 11, "Continuidade afastamento": 5, Transferência: 3 } },
  { entries: 331, cancellations: 258, netNew: 297, cityEntries: [151, 63, 93, 12, 2, 10], cityCancellations: [178, 45, 33, 2, 0, 0], reasons: { "Saiu da empresa": 82, Desistência: 69, Demissão: 65, Outros: 26, "Continuidade afastamento": 15, "Continuidade Demissão": 1 } },
  { entries: 229, cancellations: 222, netNew: 204, cityEntries: [126, 48, 53, 0, 2, 0], cityCancellations: [123, 39, 49, 7, 4, 0], reasons: { "Saiu da empresa": 84, Desistência: 37, Demissão: 17, Outros: 36, "Continuidade afastamento": 22, RESCISÃO: 19, "Continuidade Demissão": 7 } },
  { entries: 225, cancellations: 143, netNew: 198, cityEntries: [154, 38, 33, 0, 0, 0], cityCancellations: [74, 39, 30, 0, 0, 0], reasons: { "Saiu da empresa": 65, Desistência: 22, Demissão: 22, Outros: 21, "Continuidade afastamento": 5, "Afastamento INSS": 4, "CNPJ Baixado": 4 } },
];

export const OFFICIAL_OPERATIONAL_2026: Partial<Record<OfficialMonth2026, OfficialOperationalInput>> =
  Object.fromEntries(operationalRows.map((row, index) => [
    OFFICIAL_MONTHS_2026[index],
    {
      entries: row.entries,
      cancellations: row.cancellations,
      netNew: row.netNew,
      entriesByCity: Object.fromEntries(OFFICIAL_CITIES.map((city, cityIndex) => [city, row.cityEntries[cityIndex] || 0])),
      cancellationsByCity: Object.fromEntries(OFFICIAL_CITIES.map((city, cityIndex) => [city, row.cityCancellations[cityIndex] || 0])),
      cancellationReasons: row.reasons,
      status: "actual",
    },
  ]));

export const getOfficialMonthIndex = (month: string) => OFFICIAL_MONTHS_2026.indexOf(month as OfficialMonth2026);

export const getOfficialInvestmentValues = (month: string) => {
  const index = getOfficialMonthIndex(month);
  return Object.fromEntries(OFFICIAL_INVESTMENTS_2026.map((item) => [item.id, index >= 0 ? item.values[index] : 0]));
};

export const getOfficialInvestmentTotal = (month: string) =>
  Number(Object.values(getOfficialInvestmentValues(month)).reduce((sum, value) => sum + value, 0).toFixed(2));

export const getOfficialBeneficiaryEvolution = () => {
  let balance = OPENING_BENEFICIARIES_JANUARY_2026;
  return OFFICIAL_MONTHS_2026.map((month, index) => {
    const operational = OFFICIAL_OPERATIONAL_2026[month];
    // Janeiro é a referência de total confirmada pelo negócio. A evolução
    // acumulada começa a partir da competência seguinte.
    if (index > 0 && operational) balance += operational.entries - operational.cancellations;
    return {
      month,
      opening: index === 0 ? OPENING_BENEFICIARIES_JANUARY_2026 : undefined,
      ending: balance,
      status: operational ? operational.status : "not_sent" as OfficialDataStatus,
    };
  });
};

export const getOfficialBeneficiaries = (month: string) =>
  getOfficialBeneficiaryEvolution().find((item) => item.month === month)?.ending ?? OPENING_BENEFICIARIES_JANUARY_2026;

export const getOfficialStatuses = (month: string): {
  operational: OfficialDataStatus;
  marketing: OfficialDataStatus;
  investment: OfficialDataStatus;
} => ({
  operational: OFFICIAL_OPERATIONAL_2026[month as OfficialMonth2026]?.status ?? "not_sent",
  marketing: OFFICIAL_META_2026[month as OfficialMonth2026]?.status ?? "not_sent",
  investment: getOfficialMonthIndex(month) <= 5 ? "actual" : "projected",
});
