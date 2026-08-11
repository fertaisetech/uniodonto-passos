import * as XLSX from "xlsx";

export type OperationalStatus = "complete" | "partial" | "not_sent";

export interface OperationalCityEntry {
  cityKey: string;
  cityOriginal: string;
  cityName: string;
  entries: number;
  cancellations: number;
  partial: boolean;
}

export interface OperationalCancellationReason {
  reasonOriginal: string;
  reasonNormalized: string;
  quantity: number;
}

export interface OperationalWarning {
  code: string;
  sheet: string;
  cell?: string;
  message: string;
}

export interface MonthlyOperationalData {
  competence: string;
  year: number;
  month: number;
  status: OperationalStatus;
  entries: number;
  cancellations: number;
  balance: number;
  entriesByCity: OperationalCityEntry[];
  cancellationReasons: OperationalCancellationReason[];
  warnings: OperationalWarning[];
  source: { fileName: string; importedAt: string; hash?: string };
}

export interface OperationalImportResult {
  months: MonthlyOperationalData[];
  warnings: OperationalWarning[];
  ignoredSheets: string[];
}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const SHEET_CITIES: Record<string, string> = {
  "passos 2026": "Passos",
  "s j b gloria 2026": "São João Batista do Glória",
  "itau 2026": "Itaú de Minas",
  "pratapolis 2026": "Pratápolis",
  "paraiso 2026": "São Sebastião do Paraíso",
  "cassia 2026": "Cássia",
};

const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const numberValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const monthIndex = (value: unknown) => MONTHS.findIndex((month) => normalize(value) === normalize(month));
const reasonLabel = (value: unknown) => String(value ?? "Outros").replace(/\s+/g, " ").trim() || "Outros";

const sectionRow = (rows: unknown[][], text: string) => rows.findIndex((row) => normalize(row[0]).includes(normalize(text)));
const monthRows = (rows: unknown[][], start: number) => {
  const result = new Map<number, { row: unknown[]; index: number }>();
  for (let i = start + 1; i < rows.length; i += 1) {
    const index = monthIndex(rows[i]?.[0]);
    if (index >= 0) result.set(index, { row: rows[i], index: i });
    if (normalize(rows[i]?.[0]) === "total") break;
  }
  return result;
};

function readSection(rows: unknown[][], start: number, month: number, cancellation: boolean, sheet: string) {
  if (start < 0) return { quantity: 0, partial: false, reasons: [] as OperationalCancellationReason[], warnings: [] as OperationalWarning[] };
  const headers = rows[start + 2] || [];
  const target = monthRows(rows, start).get(month);
  if (!target) return { quantity: 0, partial: false, reasons: [], warnings: [] };
  let quantity = 0;
  let partial = false;
  const reasons: OperationalCancellationReason[] = [];
  const warnings: OperationalWarning[] = [];
  for (let c = 1; c < target.row.length; c += 2) {
    const header = reasonLabel(headers[c]);
    const count = numberValue(target.row[c]);
    const money = numberValue(target.row[c + 1]);
    if (money !== null && count === null && money > 0) {
      partial = true;
      warnings.push({ code: "MONEY_WITHOUT_QUANTITY", sheet, cell: `${target.index + 1}:${c + 1}`, message: `Valor monetário sem quantidade em ${header}.` });
    }
    if (count === null) continue;
    if (count < 0 || !Number.isInteger(count)) {
      warnings.push({ code: "INVALID_QUANTITY", sheet, cell: `${target.index + 1}:${c + 1}`, message: `Quantidade inválida em ${header}.` });
      continue;
    }
    quantity += count;
    if (cancellation) reasons.push({ reasonOriginal: header, reasonNormalized: normalize(header), quantity: count });
  }
  return { quantity, partial, reasons, warnings };
}

export function parseOperationalWorkbook(input: ArrayBuffer | Uint8Array | XLSX.WorkBook, fileName = "planilha.xlsx", importedAt = new Date().toISOString()): OperationalImportResult {
  const workbook = input && typeof input === "object" && "SheetNames" in input
    ? input as XLSX.WorkBook
    : XLSX.read(input, { type: input instanceof ArrayBuffer ? "array" : "array", raw: true });
  const warnings: OperationalWarning[] = [];
  const ignoredSheets = workbook.SheetNames.filter((name) => normalize(name) === "investimento mensal" || !SHEET_CITIES[normalize(name)]);
  const operationalSheets = workbook.SheetNames.filter((name) => Boolean(SHEET_CITIES[normalize(name)]));
  const detectedYear = Number(operationalSheets.map((name) => name.match(/(20\d{2})/)?.[1]).find(Boolean)) || new Date().getFullYear();
  for (const sheet of workbook.SheetNames) {
    if (!SHEET_CITIES[normalize(sheet)] && normalize(sheet) !== "investimento mensal") warnings.push({ code: "IGNORED_SHEET", sheet, message: `Aba "${sheet}" não corresponde a uma unidade operacional conhecida.` });
  }
  const months = MONTHS.map((monthName, month) => {
    const entriesByCity: OperationalCityEntry[] = [];
    const reasonMap = new Map<string, OperationalCancellationReason>();
    const monthWarnings: OperationalWarning[] = [];
    let entries = 0;
    let cancellations = 0;
    let hasAny = false;
    let partial = false;
    for (const sheet of operationalSheets) {
      const cityName = SHEET_CITIES[normalize(sheet)];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheet], { header: 1, raw: true, defval: null });
      const entryStart = sectionRow(rows, "LEVANTAMENTO ANUAL VENDAS");
      const cancelStart = sectionRow(rows, "LEVANTAMENTO ANUAL CANCELAMENTO");
      const entry = readSection(rows, entryStart, month, false, sheet);
      const cancel = readSection(rows, cancelStart, month, true, sheet);
      const cityPartial = entry.partial;
      entries += entry.quantity;
      cancellations += cancel.quantity;
      partial = partial || cityPartial;
      hasAny = hasAny || entry.quantity > 0 || cancel.quantity > 0 || entry.partial || cancel.partial;
      entriesByCity.push({ cityKey: normalize(cityName).replace(/\s/g, "-"), cityOriginal: sheet, cityName, entries: entry.quantity, cancellations: cancel.quantity, partial: cityPartial });
      for (const reason of cancel.reasons) {
        const key = normalize(reason.reasonOriginal);
        const current = reasonMap.get(key);
        reasonMap.set(key, current ? { ...current, quantity: current.quantity + reason.quantity } : reason);
      }
      monthWarnings.push(...entry.warnings, ...cancel.warnings);
    }
    const status: OperationalStatus = !hasAny ? "not_sent" : partial ? "partial" : "complete";
    const normalizedMonth = String(month + 1).padStart(2, "0");
    return {
      competence: `${detectedYear}-${normalizedMonth}`,
      year: detectedYear,
      month: month + 1,
      status,
      entries,
      cancellations,
      balance: entries - cancellations,
      entriesByCity,
      cancellationReasons: [...reasonMap.values()],
      warnings: monthWarnings,
      source: { fileName, importedAt },
    };
  }).filter((item) => item.status !== "not_sent");
  return { months, warnings, ignoredSheets };
}

export const operationalMonthKey = (competence: string) => {
  const [year, month] = competence.split("-");
  return `${MONTHS[Number(month) - 1]}/${year}`;
};
