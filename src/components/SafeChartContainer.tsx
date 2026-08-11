import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";

type SafeChartContainerProps = {
  children: ReactElement<{ width?: number; height?: number }>;
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
        cloneElement(children, {
          width: Math.max(1, Math.floor(size.width)),
          height: Math.max(1, Math.floor(size.height)),
        })
      ) : (
        <div className="flex h-full items-center justify-center text-xs font-semibold text-slate-400">
          Carregando gráfico…
        </div>
      )}
    </div>
  );
}
