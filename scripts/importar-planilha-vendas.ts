/**
 * Comando local para ler a planilha "LEVANTAMENTO VENDAS E EXCLUSÕES" (Fernando)
 * e calcular os números reais de Inclusões / Cancelamentos / Movimentação por
 * Unidade / Motivos de Cancelamento para um mês específico, prontos para
 * alimentar as telas Visão Geral, Dashboard, Relatórios e Envio/Integração.
 *
 * Uso:
 *   npm run importar:planilha -- "C:\caminho\LEVANTAMENTO ....xlsx" --mes "Maio/2026"
 *
 * Por padrão roda em modo "dry run": só calcula e grava um JSON local em
 * ./relatorios-importacao/. Nada é enviado ao Firestore.
 *
 * Para gravar de verdade no Firestore (mesmas credenciais de serviço que a
 * integração do Google Sheets já usa em server/routes.ts: GOOGLE_PROJECT_ID,
 * GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY), rode com --escrever. Sem essas
 * três variáveis de ambiente configuradas, o comando recusa a escrita.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import XLSX from "xlsx";

// ---------------------------------------------------------------------------
// 1. Unidades da planilha, na ordem das abas (os nomes das abas chegam com
//    acentuação corrompida no arquivo-fonte — por isso mapeamos por posição,
//    não por texto). Confirmar com o Fernando se a grafia abaixo está certa.
// ---------------------------------------------------------------------------
const UNIDADES = [
  "Passos",
  "São João Batista do Glória",
  "Itaú de Minas",
  "Pratápolis",
  "S.S. Paraíso",
  "Cássia",
] as const;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// ---------------------------------------------------------------------------
// 2. Mapa: cabeçalho de motivo na planilha -> categoria fixa do dashboard.
//    Isto é uma escolha de negócio, não técnica — revisar com o Fernando.
//    Qualquer cabeçalho que não aparecer aqui cai em "Outros" e é avisado no
//    console para você decidir se merece uma entrada própria.
// ---------------------------------------------------------------------------
type MotivoApp =
  | "CPF/CNPJ retornando"
  | "Cancelamento"
  | "Demissão"
  | "Pediu as contas"
  | "Mudança"
  | "Outros";

const REASON_MAP: Record<string, MotivoApp> = {
  "demissão": "Demissão",
  "continuidade demissão": "Demissão",
  "desistência": "Pediu as contas",
  "saiu da empresa": "Pediu as contas",
  "rescisão": "Cancelamento",
  "cnpj baixado": "Cancelamento",
  "continuidade afastamento": "Outros",
  "afastamento inss": "Outros",
  "outros": "Outros",
  // "Transferência" é tratada à parte (ver EXCLUIR_TRANSFERENCIAS abaixo) —
  // não conta como perda real, é troca de unidade dentro da própria Uniodonto.
};

// Transferências somam nos dois lados (saída de uma unidade, entrada em
// outra) e por padrão são excluídas do total de vendas/cancelamentos para
// não inflar os dois lados do funil com o mesmo evento. Mude para false se
// quiser contá-las como perda/ganho real.
const EXCLUIR_TRANSFERENCIAS = true;

// ---------------------------------------------------------------------------
// 3. CLI args
// ---------------------------------------------------------------------------
function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [key, inlineVal] = a.slice(2).split("=");
      if (inlineVal !== undefined) {
        flags[key] = inlineVal;
      } else if (argv[i + 1] && !argv[i + 1].startsWith("--")) {
        flags[key] = argv[++i];
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const xlsxPath = positional[0];
const mesAlvo = String(flags.mes || "");
const escrever = Boolean(flags.escrever);
const outPathArg = flags.out ? String(flags.out) : null;

if (!xlsxPath || !mesAlvo) {
  console.error(
    "\nUso: npm run importar:planilha -- \"<caminho da planilha.xlsx>\" --mes \"Maio/2026\" [--escrever] [--out arquivo.json]\n",
  );
  process.exit(1);
}

const [mesNome, anoTexto] = mesAlvo.split("/");
const mesIndex = MESES.indexOf(mesNome);
const ano = Number(anoTexto);
if (mesIndex < 0 || !Number.isFinite(ano)) {
  console.error(`Mês inválido: "${mesAlvo}". Use o formato "Maio/2026".`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 4. Leitura da planilha
// ---------------------------------------------------------------------------
type Row = (string | number | null)[];

interface UnidadeMes {
  vendasCount: number;
  vendasValor: number;
  cancelCount: number;
  cancelValor: number;
  transferenciasExcluidas: { vendas: number; cancel: number };
  motivos: Record<MotivoApp, number>;
}

const motivosVazios = (): Record<MotivoApp, number> => ({
  "CPF/CNPJ retornando": 0,
  Cancelamento: 0,
  Demissão: 0,
  "Pediu as contas": 0,
  Mudança: 0,
  Outros: 0,
});

function lerBloco(
  rows: Row[],
  tituloRow: number,
  mesFiltro: string,
): { porCanal: { header: string; count: number; valor: number }[] } {
  const headerRow = tituloRow + 2;
  const firstMonthRow = tituloRow + 4;
  const headers = rows[headerRow] || [];
  let lastCol = 0;
  headers.forEach((v, i) => { if (v !== null && v !== undefined && v !== "") lastCol = i; });

  const monthRowIndex = firstMonthRow + MESES.indexOf(mesFiltro);
  const row = rows[monthRowIndex] || [];

  const porCanal: { header: string; count: number; valor: number }[] = [];

  for (let c = 1; c <= lastCol; c += 2) {
    const cnt = row[c];
    const val = row[c + 1];
    if (cnt === null && val === null) continue;
    const headerLabel = String(headers[c] ?? "").trim() || `(coluna ${c + 1})`;
    const c1 = Number(cnt) || 0;
    const v1 = Number(val) || 0;
    porCanal.push({ header: headerLabel, count: c1, valor: v1 });
  }

  return { porCanal };
}

function lerMesPorUnidade(rows: Row[], mesFiltro: string, verbose: boolean): UnidadeMes {
  const cabecalhosNaoMapeados = new Set<string>();
  let tituloVendas = -1;
  let tituloCancel = -1;
  rows.forEach((row, i) => {
    const v = row[0];
    if (typeof v === "string" && v.toUpperCase().includes("ANUAL")) {
      if (v.toUpperCase().includes("VENDA")) tituloVendas = i;
      else tituloCancel = i;
    }
  });

  const motivos = motivosVazios();
  let vendasCount = 0, vendasValor = 0, cancelCount = 0, cancelValor = 0;
  let transferVendas = 0, transferCancel = 0;

  if (tituloVendas >= 0) {
    // Bloco de VENDAS: canais de venda (Balcão, vendedoras, ...) — não passa
    // pelo REASON_MAP, que só existe para classificar motivo de cancelamento.
    const bloco = lerBloco(rows, tituloVendas, mesFiltro);
    for (const canal of bloco.porCanal) {
      const isTransfer = canal.header.toLowerCase().includes("transfer");
      if (isTransfer && EXCLUIR_TRANSFERENCIAS) {
        transferVendas += canal.count;
        continue;
      }
      vendasCount += canal.count;
      vendasValor += canal.valor;
    }
  }
  if (tituloCancel >= 0) {
    const bloco = lerBloco(rows, tituloCancel, mesFiltro);
    for (const canal of bloco.porCanal) {
      const isTransfer = canal.header.toLowerCase().includes("transfer");
      if (isTransfer && EXCLUIR_TRANSFERENCIAS) {
        transferCancel += canal.count;
        continue;
      }
      cancelCount += canal.count;
      cancelValor += canal.valor;
      const key = canal.header.toLowerCase();
      if (!(key in REASON_MAP) && key !== "outros") {
        cabecalhosNaoMapeados.add(canal.header);
      }
      const motivo = REASON_MAP[key] ?? "Outros";
      motivos[motivo] += canal.count;
    }
  }

  if (verbose && cabecalhosNaoMapeados.size > 0) {
    console.warn(
      `  [aviso] motivo(s) de cancelamento sem mapeamento explícito (foram para "Outros"): ${[...cabecalhosNaoMapeados].join(", ")}`,
    );
  }

  return {
    vendasCount, vendasValor, cancelCount, cancelValor,
    transferenciasExcluidas: { vendas: transferVendas, cancel: transferCancel },
    motivos,
  };
}

// ---------------------------------------------------------------------------
// 5. Execução
// ---------------------------------------------------------------------------
console.log(`\nLendo planilha: ${xlsxPath}`);
const wb = XLSX.readFile(resolve(xlsxPath));
if (wb.SheetNames.length !== UNIDADES.length) {
  console.warn(
    `[aviso] a planilha tem ${wb.SheetNames.length} aba(s), mas o comando espera ${UNIDADES.length} (uma por unidade). Confira a ordem das abas antes de confiar no resultado.`,
  );
}

function totalDoMes(mes: string, verbose: boolean) {
  const porUnidade: Record<string, UnidadeMes> = {};
  UNIDADES.forEach((unidade, idx) => {
    const sheetName = wb.SheetNames[idx];
    if (!sheetName) return;
    const rows = XLSX.utils.sheet_to_json<Row>(wb.Sheets[sheetName], {
      header: 1,
      raw: true,
      defval: null,
    });
    if (verbose) console.log(`\nUnidade: ${unidade} (aba ${idx + 1}: "${sheetName}")`);
    porUnidade[unidade] = lerMesPorUnidade(rows, mes, verbose);
  });
  return porUnidade;
}

const mesAtualDados = totalDoMes(mesNome, true);

const mesAnteriorNome = mesIndex > 0 ? MESES[mesIndex - 1] : null;
const mesAnteriorDados = mesAnteriorNome ? totalDoMes(mesAnteriorNome, false) : null;

function somar(dados: Record<string, UnidadeMes>, campo: "vendasCount" | "cancelCount") {
  return Object.values(dados).reduce((acc, u) => acc + u[campo], 0);
}

const additionsCurrent = somar(mesAtualDados, "vendasCount");
const cancellationsCurrent = somar(mesAtualDados, "cancelCount");
const additionsPrevious = mesAnteriorDados ? somar(mesAnteriorDados, "vendasCount") : additionsCurrent;
const cancellationsPrevious = mesAnteriorDados ? somar(mesAnteriorDados, "cancelCount") : cancellationsCurrent;

const variacao = (atual: number, anterior: number) =>
  anterior === 0 ? 0 : Number((((atual - anterior) / anterior) * 100).toFixed(1));

const cityMovement = UNIDADES.map((city) => ({
  city,
  entries: mesAtualDados[city].vendasCount,
  cancellations: mesAtualDados[city].cancelCount,
}));

const cancellationReasons = (Object.keys(motivosVazios()) as MotivoApp[]).map((reason) => ({
  reason,
  count: Object.values(mesAtualDados).reduce((acc, u) => acc + u.motivos[reason], 0),
}));

const patch = {
  month: mesAlvo,
  summary: {
    additions: {
      current: additionsCurrent,
      previous: additionsPrevious,
      variation: variacao(additionsCurrent, additionsPrevious),
    },
    cancellations: {
      current: cancellationsCurrent,
      previous: cancellationsPrevious,
      variation: variacao(cancellationsCurrent, cancellationsPrevious),
    },
    sales: {
      current: additionsCurrent,
      previous: additionsPrevious,
      variation: variacao(additionsCurrent, additionsPrevious),
    },
  },
  beneficiariesData: { cityMovement },
  cancellationReasons,
};

// ---------------------------------------------------------------------------
// 6. Relatório no console
// ---------------------------------------------------------------------------
console.log(`\n${"=".repeat(72)}`);
console.log(`RESUMO — ${mesAlvo}`);
console.log("=".repeat(72));
console.log(
  `${"Unidade".padEnd(28)}${"Vendas".padStart(8)}${"Cancel.".padStart(9)}${"Saldo".padStart(8)}${"Transf. excl. (v/c)".padStart(22)}`,
);
UNIDADES.forEach((u) => {
  const d = mesAtualDados[u];
  const saldo = d.vendasCount - d.cancelCount;
  console.log(
    `${u.padEnd(28)}${String(d.vendasCount).padStart(8)}${String(d.cancelCount).padStart(9)}${String(saldo).padStart(8)}${`${d.transferenciasExcluidas.vendas}/${d.transferenciasExcluidas.cancel}`.padStart(22)}`,
  );
});
console.log("-".repeat(72));
console.log(
  `${"TOTAL".padEnd(28)}${String(additionsCurrent).padStart(8)}${String(cancellationsCurrent).padStart(9)}${String(additionsCurrent - cancellationsCurrent).padStart(8)}`,
);
console.log(
  `\nMotivos de cancelamento (mapeados):`,
);
cancellationReasons.forEach((r) => console.log(`  ${r.reason.padEnd(22)} ${r.count}`));
if (mesAnteriorDados) {
  console.log(
    `\nComparado a ${mesAnteriorNome}/${ano}: Inclusões ${additionsPrevious} -> ${additionsCurrent} (${variacao(additionsCurrent, additionsPrevious)}%) · Cancelamentos ${cancellationsPrevious} -> ${cancellationsCurrent} (${variacao(cancellationsCurrent, cancellationsPrevious)}%)`,
  );
} else {
  console.log(`\n(sem mês anterior na planilha para comparar — variação zerada)`);
}

// ---------------------------------------------------------------------------
// 7. Grava JSON local
// ---------------------------------------------------------------------------
const mesSlug = mesAlvo.replace(/\//g, "-");
const outPath = outPathArg
  ? resolve(outPathArg)
  : resolve(`./relatorios-importacao/patch-${mesSlug}.json`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(patch, null, 2), "utf-8");
console.log(`\nJSON gravado em: ${outPath}`);

// ---------------------------------------------------------------------------
// 8. Snippet pronto para colar no console do navegador (modo 100% local,
//    sem precisar de credencial nenhuma — mescla com o que já está salvo em
//    localStorage para este mês e recarrega a página).
// ---------------------------------------------------------------------------
const localKey = `uniodonto_monthly_dashboard_${mesAlvo}`;
const snippet = `(() => {
  const key = ${JSON.stringify(localKey)};
  const patch = ${JSON.stringify(patch)};
  const existing = JSON.parse(localStorage.getItem(key) || "null") || {};
  const merged = {
    ...existing,
    ...patch,
    summary: { ...existing.summary, ...patch.summary },
    beneficiariesData: { ...existing.beneficiariesData, ...patch.beneficiariesData },
  };
  localStorage.setItem(key, JSON.stringify(merged));
  location.reload();
})();`;
const snippetPath = resolve(`./relatorios-importacao/colar-no-console-${mesSlug}.js`);
writeFileSync(snippetPath, snippet, "utf-8");
console.log(`Snippet para o console do navegador: ${snippetPath}`);
console.log(
  `  (abra o app local com "npm run dev", abra o DevTools > Console, cole o conteúdo desse arquivo e dê Enter)`,
);

// ---------------------------------------------------------------------------
// 9. Escrita real no Firestore — só roda com --escrever e as 3 credenciais
//    já usadas pela integração do Google Sheets (server/routes.ts).
// ---------------------------------------------------------------------------
if (escrever) {
  const { GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;
  if (!GOOGLE_PROJECT_ID || !GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    console.error(
      "\n--escrever pedido, mas faltam GOOGLE_PROJECT_ID / GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY no ambiente. Nada foi escrito no Firestore.",
    );
    process.exit(1);
  }
  const { cert, getApps, initializeApp } = await import("firebase-admin/app");
  const { getFirestore } = await import("firebase-admin/firestore");
  const privateKey = GOOGLE_PRIVATE_KEY.includes("\\n")
    ? GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : GOOGLE_PRIVATE_KEY;
  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId: GOOGLE_PROJECT_ID, clientEmail: GOOGLE_CLIENT_EMAIL, privateKey }),
    });
  }
  const db = getFirestore();
  const docRef = db.collection("organizations").doc("uniodonto").collection("months").doc(mesSlug);
  const existingSnap = await docRef.get();
  console.log(
    existingSnap.exists
      ? `\nDocumento ${mesSlug} já existe no Firestore — este patch fará merge, preservando os campos não cobertos pela planilha (leads, agendamentos, NPS, investimento, ROI, CAC, beneficiários totais).`
      : `\nDocumento ${mesSlug} ainda não existe no Firestore — será criado só com os campos que a planilha cobre.`,
  );
  await docRef.set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  console.log(`Gravado no Firestore: organizations/uniodonto/months/${mesSlug}`);
} else {
  console.log(
    `\nModo dry-run (padrão): nada foi enviado ao Firestore. Para escrever de verdade, rode de novo com --escrever (exige GOOGLE_PROJECT_ID/GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY no ambiente).`,
  );
}
