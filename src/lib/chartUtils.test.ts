import { describe, expect, it } from "vitest";
import {
  finiteNumber,
  hasChartDimensions,
  normalizeChartData,
} from "./chartUtils";

describe("chartUtils", () => {
  it("normalizes invalid numeric values without producing NaN or Infinity", () => {
    const result = normalizeChartData(
      [{ value: NaN }, { value: Infinity }, { value: "12" }],
      ["value"],
    );
    expect(result.map((item) => item.value)).toEqual([0, 0, 12]);
    expect(finiteNumber(undefined)).toBe(0);
  });

  it("rejects zero and negative chart dimensions", () => {
    expect(hasChartDimensions(0, 200)).toBe(false);
    expect(hasChartDimensions(-1, 200)).toBe(false);
    expect(hasChartDimensions(320, 200)).toBe(true);
  });

  it("preserves empty datasets for the empty-state UI", () => {
    expect(normalizeChartData([], ["value"])).toEqual([]);
  });
});
