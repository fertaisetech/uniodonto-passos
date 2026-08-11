import { Router } from "express";
import { google } from "googleapis";
import type {
  BeneficiariesData,
  FunnelDataPoint,
  InvestmentItem,
  MetricItem,
  MonthlyDashboardDocument,
  NpsDataPoint,
  SummaryData,
} from "../src/lib/dashboardData";

export const apiRouter = Router();

const DEFAULT_MONTH = "Maio/2026";
const MONTHLY_SHEET_NAME =
  process.env.GOOGLE_MONTHLY_SHEET_NAME || "monthly_dashboard";
const SHEET_CACHE_TTL_MS =
  Number(process.env.GOOGLE_SHEET_CACHE_TTL || "60") * 1000;
const SCOPE = ["https://www.googleapis.com/auth/spreadsheets.readonly"];

type RawSheetRow = Record<string, string>;
type CacheEntry<T> = { value: T; loadedAt: number };
type AppUserProfileLike = {
  uid: string;
  email: string;
  name: string;
  role: "Administrador" | "Operador";
  photoUrl?: string;
  phone?: string;
  updatedAt?: string;
  lgpdAcceptedAt?: string;
};

const sheetCache = new Map<string, CacheEntry<RawSheetRow[]>>();

const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const normalizePrivateKey = (value: string) => value.replace(/\\n/g, "\n");

const getServiceAccount = () => ({
  projectId: requiredEnv("GOOGLE_PROJECT_ID"),
  clientEmail: requiredEnv("GOOGLE_CLIENT_EMAIL"),
  privateKey: normalizePrivateKey(requiredEnv("GOOGLE_PRIVATE_KEY")),
});

const getSheetsClient = () => {
  const { clientEmail, privateKey } = getServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPE,
  });
  return google.sheets({ version: "v4", auth });
};

const normalizeMonth = (value?: string | null) =>
  value?.trim() || DEFAULT_MONTH;

const normalizeHeader = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

const parseJsonCell = <T>(value: string | undefined, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const rowToObject = (headers: string[], row: string[]): RawSheetRow => {
  const record: RawSheetRow = {};
  headers.forEach((header, index) => {
    const cell = row[index];
    if (cell !== undefined && cell !== "") {
      record[normalizeHeader(header)] = cell;
    }
  });
  return record;
};

const loadMonthlyRows = async (): Promise<RawSheetRow[]> => {
  const cached = sheetCache.get(MONTHLY_SHEET_NAME);
  if (cached && Date.now() - cached.loadedAt < SHEET_CACHE_TTL_MS) {
    return cached.value;
  }

  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: requiredEnv("GOOGLE_SPREADSHEET_ID"),
    range: `${MONTHLY_SHEET_NAME}!A:Z`,
  });

  const values = response.data.values || [];
  if (values.length === 0) {
    throw new Error(
      `Worksheet "${MONTHLY_SHEET_NAME}" is empty or unavailable.`,
    );
  }

  const [headerRow, ...dataRows] = values;
  const headers = headerRow.map((header) => String(header || ""));
  const rows = dataRows
    .filter((row) => row.some((cell) => String(cell || "").trim() !== ""))
    .map((row) =>
      rowToObject(
        headers,
        row.map((cell) => String(cell || "")),
      ),
    );

  sheetCache.set(MONTHLY_SHEET_NAME, {
    value: rows,
    loadedAt: Date.now(),
  });

  return rows;
};

const findMonthlyRow = async (month?: string | null) => {
  const normalizedMonth = normalizeMonth(month);
  const rows = await loadMonthlyRows();
  const row = rows.find((item) => {
    const sheetMonth = item.month || item.mes || item.month_key || item.mes_ano;
    return (sheetMonth || "").trim() === normalizedMonth;
  });

  if (!row) {
    throw new Error(
      `No row found for month "${normalizedMonth}" in worksheet "${MONTHLY_SHEET_NAME}".`,
    );
  }

  return row;
};

const resolveMonthlyDocument = (
  row: RawSheetRow,
  month?: string | null,
): MonthlyDashboardDocument => {
  const normalizedMonth = normalizeMonth(
    month || row.month || row.mes || row.month_key,
  );

  const summary = parseJsonCell<SummaryData>(
    row.summary_json || row.summary || row.summary_data,
    {
      beneficiaries: { current: 0, previous: 0, variation: 0, target: 0 },
      additions: { current: 0, previous: 0, variation: 0, target: 0 },
      cancellations: { current: 0, previous: 0, variation: 0, target: 0 },
      investment: { current: 0, previous: 0, variation: 0, target: 0 },
      roi: { current: 0, previous: 0, variation: 0, target: 0 },
      leads: { current: 0, previous: 0, variation: 0, target: 0 },
      appointments: { current: 0, previous: 0, variation: 0, target: 0 },
      sales: { current: 0, previous: 0, variation: 0, target: 0 },
      cac: { current: 0, previous: 0, variation: 0, target: 0 },
      nps: { current: 0, previous: 0, variation: 0, target: 0 },
    },
  );

  const beneficiariesData = parseJsonCell<BeneficiariesData>(
    row.beneficiaries_json || row.beneficiaries || row.beneficiaries_data,
    { evolution: [], distribution: [] },
  );

  const funnelData = parseJsonCell<FunnelDataPoint[]>(
    row.funnel_json || row.funnel || row.funnel_data,
    [],
  );

  const npsData = parseJsonCell<NpsDataPoint[]>(
    row.nps_json || row.nps || row.nps_data,
    [],
  );

  const investments = parseJsonCell<InvestmentItem[]>(
    row.investments_json || row.investments || row.investments_data,
    [],
  );

  const metrics = parseJsonCell<MetricItem[]>(
    row.metrics_json || row.metrics || row.metrics_data,
    [],
  );

  const cancellationReasons = parseJsonCell<
    MonthlyDashboardDocument["cancellationReasons"]
  >(
    row.cancellation_reasons_json ||
      row.cancellation_reasons ||
      row.cancellationReasons,
    [],
  );

  const updatedBy =
    row.updated_by_email || row.updated_by || row.updatedby || "";

  return {
    month: normalizedMonth,
    summary,
    beneficiariesData,
    funnelData,
    npsData,
    investments,
    metrics,
    cancellationReasons,
    updatedAt: row.updated_at || row.updatedat || undefined,
    updatedBy: updatedBy
      ? ({
          uid: row.updated_by_uid || updatedBy,
          email: updatedBy,
          name: row.updated_by_name || updatedBy,
          role:
            (row.updated_by_role as AppUserProfileLike["role"]) || "Operador",
          photoUrl: row.updated_by_photo_url || undefined,
          phone: row.updated_by_phone || undefined,
          updatedAt: row.updated_at || undefined,
        } as AppUserProfileLike)
      : null,
  };
};

const getMonthlyDocument = async (month?: string | null) => {
  const row = await findMonthlyRow(month);
  return resolveMonthlyDocument(row, month);
};

apiRouter.get("/dashboard/summary", async (req, res) => {
  try {
    const record = await getMonthlyDocument(
      req.query.month as string | undefined,
    );
    return res.json(record.summary);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load dashboard summary from Google Sheets.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiRouter.get("/beneficiaries", async (req, res) => {
  try {
    const record = await getMonthlyDocument(
      req.query.month as string | undefined,
    );
    return res.json(record.beneficiariesData);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load beneficiaries data from Google Sheets.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiRouter.get("/funnel", async (req, res) => {
  try {
    const record = await getMonthlyDocument(
      req.query.month as string | undefined,
    );
    return res.json(record.funnelData);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load funnel data from Google Sheets.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiRouter.get("/marketing", async (req, res) => {
  try {
    const record = await getMonthlyDocument(
      req.query.month as string | undefined,
    );
    return res.json({ investments: record.investments });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load marketing data from Google Sheets.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiRouter.get("/cities", async (req, res) => {
  try {
    const record = await getMonthlyDocument(
      req.query.month as string | undefined,
    );
    return res.json(
      record.beneficiariesData.distribution.map((item) => ({
        city: item.plan,
        beneficiaries: item.count,
      })),
    );
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load city data from Google Sheets.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiRouter.get("/nps", async (req, res) => {
  try {
    const record = await getMonthlyDocument(
      req.query.month as string | undefined,
    );
    return res.json(record.npsData);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load NPS data from Google Sheets.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiRouter.get("/sync/status", async (req, res) => {
  try {
    const month = normalizeMonth(req.query.month as string | undefined);
    const record = await getMonthlyDocument(month);
    return res.json({
      status: "ready",
      source: "google-sheets",
      month,
      spreadsheetId: requiredEnv("GOOGLE_SPREADSHEET_ID"),
      sheetName: MONTHLY_SHEET_NAME,
      updatedAt: record.updatedAt || null,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to read sync status from Google Sheets.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

apiRouter.post("/sync", async (req, res) => {
  const month = normalizeMonth(req.body?.month || req.query.month);
  return res.status(409).json({
    status: "disabled",
    month,
    error:
      "A sincronização antiga foi desativada para proteger a base oficial versionada.",
  });
});
