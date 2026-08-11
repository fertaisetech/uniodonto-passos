import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ElementType } from "react";
import clsx from "clsx";

interface KPICardProps {
  title: string;
  value: string | number;
  variation: number;
  target?: number;
  icon: ElementType;
  tooltip?: string;
}

export function KPICard({ title, value, variation, target, icon: Icon, tooltip }: KPICardProps) {
  const isPositive = variation > 0;
  const isNeutral = variation === 0;

  const parsedCurrentValue =
    typeof value === "number"
      ? value
      : Number.parseFloat(String(value).replace(/[^0-9.-]+/g, ""));
  const valueIsNumeric = Number.isFinite(parsedCurrentValue);
  const currentVal = valueIsNumeric ? parsedCurrentValue : 0;
  const percentTarget =
    target && valueIsNumeric
      ? Math.min(100, Math.max(0, (currentVal / target) * 100))
      : 0;

  return (
    <div className="glass-card shadow-sm p-3 sm:p-3.5 flex flex-col hover:shadow-md transition-shadow relative group">
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0">
          <p className="text-xs sm:text-[13px] font-medium text-text-secondary flex items-center gap-1 cursor-default truncate">
            {title}
          </p>
          <h3 className="text-lg sm:text-xl font-black text-text-primary mt-0.5 tracking-tight truncate">{value}</h3>
        </div>
        <div className="p-1.5 bg-primary/5 rounded-lg text-primary shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      
      <div className="mt-auto">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={clsx(
            "flex items-center text-[10px] font-extrabold px-1.5 py-0.5 rounded",
            isPositive ? "bg-success/10 text-success" : isNeutral ? "bg-gray-100 text-gray-600" : "bg-danger/10 text-danger"
          )}>
            {isPositive ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : isNeutral ? <Minus className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
            {Math.abs(variation)}%
          </span>
          <span className="text-[10px] sm:text-xs text-text-secondary">vs. mês ant.</span>
        </div>
        
        {target !== undefined && valueIsNumeric && (
          <div className="w-full">
            <div className="flex justify-between text-[9px] text-text-secondary mb-0.5">
              <span>Progresso</span>
              <span>{percentTarget.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
              <div 
                className={clsx("h-full rounded-full", percentTarget >= 100 ? "bg-success" : "bg-primary")} 
                style={{ width: `${percentTarget}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {tooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs p-2 bg-text-primary text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
          {tooltip}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-text-primary rotate-45"></div>
        </div>
      )}
    </div>
  );
}
