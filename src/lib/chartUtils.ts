export const finiteNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const hasChartDimensions = (width: number, height: number) =>
  width >= 1 && height >= 1;

export const normalizeChartData = <T extends Record<string, unknown>>(
  data: T[],
  numericKeys: string[],
) =>
  data.map(
    (item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          numericKeys.includes(key) ? finiteNumber(value) : value,
        ]),
      ) as T,
  );
