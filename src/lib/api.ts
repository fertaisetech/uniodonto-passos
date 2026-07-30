import {
  buildBeneficiariesFromRecord,
  buildFunnelFromRecord,
  buildNpsFromRecord,
  buildSummaryFromRecord,
  loadMonthlyDashboard,
} from "./dashboardData";

export async function fetchSummary(month?: string) {
  const record = await loadMonthlyDashboard(month || "Maio/2026");
  return buildSummaryFromRecord(record);
}

export async function fetchBeneficiaries(month?: string) {
  const record = await loadMonthlyDashboard(month || "Maio/2026");
  return buildBeneficiariesFromRecord(record);
}

export async function fetchMarketing(month?: string) {
  const record = await loadMonthlyDashboard(month || "Maio/2026");
  return { investments: record.investments };
}

export async function fetchFunnel(month?: string) {
  const record = await loadMonthlyDashboard(month || "Maio/2026");
  return buildFunnelFromRecord(record);
}

export async function fetchCities(month?: string) {
  const record = await loadMonthlyDashboard(month || "Maio/2026");
  return record.beneficiariesData.distribution.map((item) => ({
    city: item.plan,
    beneficiaries: item.count,
  }));
}

export async function fetchNps(month?: string) {
  const record = await loadMonthlyDashboard(month || "Maio/2026");
  return buildNpsFromRecord(record);
}
