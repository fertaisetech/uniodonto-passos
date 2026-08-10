export type MonthlyInvestmentValues = Record<string, number>;

// Dados extraídos exclusivamente da primeira aba "Investimento Mensal".
const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const rows: Array<[string, number[]]> = [
  ["1", [1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5, 1007.5]],
  ["2", [240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240]],
  ["3", [796, 796, 796, 796, 796, 796, 796, 796, 796, 796, 796, 796]],
  ["4", [185, 185, 185, 185, 185, 185, 185, 185, 185, 185, 185, 185]],
  ["5", [120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18, 120.18]],
  ["6", [400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400, 400]],
  ["9", [1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58, 1851.58]],
  ["14", [0, 0, 0, 2000, 2000, 2000, 1750, 1750, 1750, 1750, 1750, 1750]],
  ["11", [2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54, 2140.54]],
  ["13", [786, 786, 786, 786, 786, 786, 786, 786, 786, 786, 786, 786]],
  ["12", [1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121, 1121]],
  ["7", [1370.21, 1370.21, 1370.21, 1370.21, 1366.1, 1218.87, 1370.21, 1370.21, 1370.21, 1370.21, 1370.21, 1370.21]],
  ["8", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
];

export const getMonthlyInvestmentValues = (month: string): MonthlyInvestmentValues => {
  if (month === "Todos") return Object.fromEntries(rows.map(([id, values]) => [id, Number(values.reduce((sum, value) => sum + value, 0).toFixed(2))]));
  const index = months.indexOf(month.split("/")[0]);
  return Object.fromEntries(rows.map(([id, values]) => [id, index >= 0 ? values[index] : 0]));
};

export const getMonthlyInvestmentTotal = (month: string) =>
  Number(Object.values(getMonthlyInvestmentValues(month)).reduce((sum, value) => sum + value, 0).toFixed(2));
