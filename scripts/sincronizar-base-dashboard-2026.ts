import "dotenv/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { OFFICIAL_MONTHS_2026 } from "../src/lib/officialDashboard2026Data";
import { getDefaultMonthlyDashboard } from "../src/lib/dashboardData";

const writeEnabled = process.argv.includes("--escrever");
const records = OFFICIAL_MONTHS_2026.map((month) => getDefaultMonthlyDashboard(month));

const summary = records.map((record) => ({
  month: record.month,
  operational: record.dataQuality?.operationalStatus,
  marketing: record.dataQuality?.marketingStatus,
  investment: record.dataQuality?.investmentStatus,
  beneficiaries: record.summary.beneficiaries.current,
  additions: record.summary.additions.available === false ? "indisponível" : record.summary.additions.current,
  investmentTotal: record.summary.investment.current,
}));

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

if (!writeEnabled) {
  process.stdout.write("\nValidação concluída em modo seguro. Use --escrever somente após revisar os totais acima.\n");
  process.exit(0);
}

const projectId = process.env.GOOGLE_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Credenciais administrativas ausentes. Nenhum documento foi alterado.");
}

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const database = getFirestore();
const backupId = `base-dashboard-2026-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const backupRef = database.collection("organizations").doc("uniodonto").collection("migrationBackups").doc(backupId);
const previousDocuments = await Promise.all(OFFICIAL_MONTHS_2026.map(async (month) => {
  const ref = database.collection("organizations").doc("uniodonto").collection("months").doc(month.replace("/", "-"));
  const snapshot = await ref.get();
  return { month, existed: snapshot.exists, data: snapshot.exists ? snapshot.data() : null };
}));

await backupRef.set({
  createdAt: FieldValue.serverTimestamp(),
  sourceVersion: records[0]?.dataVersion,
  documents: previousDocuments,
});

const batch = database.batch();
records.forEach((record) => {
  const ref = database.collection("organizations").doc("uniodonto").collection("months").doc(record.month.replace("/", "-"));
  batch.set(ref, {
    ...JSON.parse(JSON.stringify(record)),
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: { email: "migration@local", name: "Migração da base oficial" },
  }, { merge: false });
});
await batch.commit();

process.stdout.write(`\nSincronização concluída. Backup de recuperação: ${backupId}\n`);
