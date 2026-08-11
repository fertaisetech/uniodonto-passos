import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseOperationalWorkbook } from "./operationalSpreadsheet";

const sourceFile = "C:/Users/famil/Desktop/1.10-Uniodonto/0.1-Referencias/LEVANTAMENTO VENDAS E EXCLUSÕES 2026  Fernando.xlsx";

describe("importação operacional da planilha", () => {
  it("consolida a planilha real de junho sem somar colunas monetárias", () => {
    const result = parseOperationalWorkbook(readFileSync(sourceFile));
    const june = result.months.find((month) => month.competence === "2026-06");

    expect(june).toBeDefined();
    expect(june?.entries).toBe(225);
    expect(june?.cancellations).toBe(143);
    expect(june?.balance).toBe(82);
    expect(june?.entriesByCity).toHaveLength(6);
    expect(june?.entriesByCity.reduce((sum, city) => sum + city.entries, 0)).toBe(225);
    expect(june?.entriesByCity.reduce((sum, city) => sum + city.cancellations, 0)).toBe(143);
    expect(june?.cancellationReasons.reduce((sum, reason) => sum + reason.quantity, 0)).toBe(143);
    expect(june?.entriesByCity).toEqual(expect.arrayContaining([
      expect.objectContaining({ cityName: "Passos", entries: 154, cancellations: 74 }),
      expect.objectContaining({ cityName: "Itaú de Minas", entries: 38, cancellations: 39 }),
      expect.objectContaining({ cityName: "São Sebastião do Paraíso", entries: 33, cancellations: 30 }),
      expect.objectContaining({ cityName: "São João Batista do Glória", entries: 0, cancellations: 0 }),
      expect.objectContaining({ cityName: "Pratápolis", entries: 0, cancellations: 0 }),
      expect.objectContaining({ cityName: "Cássia", entries: 0, cancellations: 0 }),
    ]));
  });

  it("ignora Investimento Mensal e não cria competências futuras vazias", () => {
    const result = parseOperationalWorkbook(readFileSync(sourceFile));
    expect(result.ignoredSheets).toContain("Investimento Mensal");
    expect(result.months.map((month) => month.competence)).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06",
    ]);
  });

  it("marca parciais quando existe valor monetário sem quantidade", () => {
    const workbook = XLSX.utils.book_new();
    const rows = [
      ["LEVANTAMENTO ANUAL VENDAS"],
      [],
      ["Mês", "Pessoa", "R$"],
      ["Janeiro", null, 120],
      ["TOTAL", null, 120],
      ["LEVANTAMENTO ANUAL Cancelamento"],
      [],
      ["Mês", "Motivo", "R$"],
      ["Janeiro", 1, 10],
      ["TOTAL", 1, 10],
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Passos 2026");
    const result = parseOperationalWorkbook(workbook);
    expect(result.months[0].status).toBe("partial");
    expect(result.months[0].entries).toBe(0);
    expect(result.months[0].warnings.some((warning) => warning.code === "MONEY_WITHOUT_QUANTITY")).toBe(true);
  });

  it("é determinístico ao reprocessar o mesmo arquivo", () => {
    const first = parseOperationalWorkbook(readFileSync(sourceFile), "origem.xlsx", "2026-08-10T00:00:00.000Z");
    const second = parseOperationalWorkbook(readFileSync(sourceFile), "origem.xlsx", "2026-08-10T00:00:00.000Z");
    expect(second.months).toEqual(first.months);
  });
});
