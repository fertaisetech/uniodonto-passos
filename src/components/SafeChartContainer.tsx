import { useEffect, useRef, useState, type ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

type SafeChartContainerProps = {
  children: ReactNode;
  height: number;
  empty?: boolean;
  emptyMessage?: string;
  invalid?: boolean;
};

export function SafeChartContainer({
  children,
  height,
  empty = false,
  emptyMessage = "Sem dados para exibir",
  invalid = false,
}: SafeChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setSize({ width: element.clientWidth, height: element.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const chartHeight = Math.max(1, height);
  const validDimensions = size.width >= 1 && size.height >= 1;

  return (
    <div
      ref={ref}
      className="relative h-full min-h-0 min-w-0 w-full"
      style={{ minHeight: chartHeight }}
    >
      {invalid ? (
        <div className="flex h-full min-h-[80px] items-center justify-center px-3 text-center text-xs font-semibold text-amber-600">
          Dados inválidos para o período
        </div>
      ) : empty ? (
        <div className="flex h-full min-h-[80px] items-center justify-center px-3 text-center text-xs font-semibold text-slate-400">
          {emptyMessage}
        </div>
      ) : validDimensions ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={1}
          minHeight={1}
        >
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
          Carregando gráfico…
        </div>
      )}
    </div>
  );
}
