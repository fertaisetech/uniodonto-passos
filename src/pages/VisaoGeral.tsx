import { useSearchParams } from "react-router";
import { KPICard } from "../components/KPICard";
import { SafeChartContainer } from "../components/SafeChartContainer";
import { finiteNumber } from "../lib/chartUtils";
import {
  Users,
  Target,
  BarChart,
  DollarSign,
  UserCheck,
  Star,
  Zap,
  Phone,
  ShieldClose,
} from "lucide-react";
import { useMonthlyDashboard } from "../hooks/useMonthlyDashboard";
import { getCurrentMonthKey } from "../lib/dashboardData";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  BarChart as ReBarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";

export function VisaoGeral() {
  const [searchParams] = useSearchParams();
  const month = searchParams.get("month") || getCurrentMonthKey();
  const { data: dashboardData, loading, error } = useMonthlyDashboard(month);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const {
    summary,
    beneficiariesData,
    funnelData,
    npsData,
    cancellationReasons,
  } = dashboardData;
  const operationalAvailable =
    dashboardData.dataQuality?.operationalStatus === "actual" ||
    dashboardData.dataQuality?.operationalStatus === "partial";
  const marketingAvailable =
    dashboardData.dataQuality?.marketingStatus === "actual" ||
    dashboardData.dataQuality?.marketingStatus === "review";
  const evolutionInvalid = beneficiariesData.evolution.some((item) => !Number.isFinite(Number(item.count)));
  const funnelInvalid = funnelData.some((item) => !Number.isFinite(Number(item.count)));
  const npsInvalid = npsData.some((item) => !Number.isFinite(Number(item.score)));
  const movementInvalid = !Number.isFinite(Number(summary.additions.current)) || !Number.isFinite(Number(summary.cancellations.current));
  const evolutionData = beneficiariesData.evolution
    .filter((item) => Number.isFinite(Number(item.count)))
    .map((item) => ({ ...item, count: Number(item.count) }));
  const funnelDataSafe = funnelData
    .filter((item) => Number.isFinite(Number(item.count)))
    .map((item) => ({ ...item, count: Number(item.count) }));
  const npsDataSafe = npsData
    .filter((item) => Number.isFinite(Number(item.score)))
    .map((item) => ({ ...item, score: Number(item.score) }));
  const movementData = [
    {
      date: month,
      Inclusões: finiteNumber(summary.additions.current),
      Cancelamentos: finiteNumber(summary.cancellations.current),
    },
  ];
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <div className="dashboard-content space-y-4 md:space-y-4.5">
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
          Dados exibidos localmente. A sincronização remota ainda não foi confirmada.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
        <KPICard
          title="Beneficiários Totais"
          value={summary.beneficiaries.current}
          variation={summary.beneficiaries.variation}
          target={summary.beneficiaries.target}
          icon={Users}
        />
        <KPICard
          title="Novas Inclusões"
          value={operationalAvailable ? summary.additions.current : "Indisponível"}
          variation={summary.additions.variation}
          target={summary.additions.target}
          icon={Zap}
        />
        <KPICard
          title="Cancelamentos"
          value={operationalAvailable ? summary.cancellations.current : "Indisponível"}
          variation={summary.cancellations.variation}
          target={summary.cancellations.target}
          icon={ShieldClose}
        />
        <KPICard
          title="Investimento (R$)"
          value={formatCurrency(summary.investment.current)}
          variation={summary.investment.variation}
          icon={DollarSign}
        />
        <KPICard
          title="ROI Estimado (%)"
          value={summary.roi.available === false ? "Indisponível" : summary.roi.current}
          variation={summary.roi.variation}
          icon={Target}
          tooltip="Retorno sobre Investimento"
        />

        <KPICard
          title="Leads Gerados"
          value={marketingAvailable ? summary.leads.current : "Indisponível"}
          variation={summary.leads.variation}
          target={summary.leads.target}
          icon={BarChart}
        />
        <KPICard
          title="Agendamentos"
          value={summary.appointments.available === false ? "Indisponível" : summary.appointments.current}
          variation={summary.appointments.variation}
          target={summary.appointments.target}
          icon={Phone}
        />
        <KPICard
          title="Vendas Realizadas"
          value={operationalAvailable ? summary.sales.current : "Indisponível"}
          variation={summary.sales.variation}
          target={summary.sales.target}
          icon={UserCheck}
        />
        <KPICard
          title="CAC (R$)"
          value={summary.cac.available === false ? "Indisponível" : formatCurrency(summary.cac.current)}
          variation={summary.cac.variation}
          icon={DollarSign}
          tooltip="Custo de Aquisição de Cliente"
        />
        <KPICard
          title="NPS"
          value={summary.nps.available === false ? "Indisponível" : summary.nps.current}
          variation={summary.nps.variation}
          icon={Star}
          tooltip="Net Promoter Score"
        />
      </div>

      <div className="glass-card shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-text-primary">
              Cancelamentos por motivo
            </h3>
            <p className="text-[10px] text-text-secondary">
              Distribuição do mês selecionado
            </p>
          </div>
          <span className="text-lg font-black text-[#CD176D]">
            {cancellationReasons.reduce((sum, item) => sum + item.count, 0)}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cancellationReasons.map((item) => (
            <div
              key={item.reason}
              className="rounded-xl border border-border bg-white/60 p-3"
            >
              <span className="block text-[10px] font-bold text-text-secondary">
                {item.reason}
              </span>
              <span className="block mt-1 text-xl font-black text-text-primary">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-4.5 pt-2 lg:pt-3">
        {/* Gráfico Principal Largo */}
        <div className="glass-card shadow-sm p-4 lg:p-4.5 lg:col-span-2">
          <h3 className="font-semibold text-text-primary mb-3.5">
            Evolução de Beneficiários
          </h3>
          <div className="h-[220px] sm:h-[270px] w-full">
            <SafeChartContainer height={220} empty={evolutionData.length === 0} invalid={evolutionInvalid}>
              <AreaChart
                data={evolutionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "var(--color-text-primary)" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Beneficiários"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </SafeChartContainer>
          </div>
        </div>

        {/* Gráfico Secundário Lateral */}
        <div className="glass-card shadow-sm p-4 lg:p-4.5 lg:col-span-1">
          <h3 className="font-semibold text-text-primary mb-3.5">
            Funil de Conversão
          </h3>
          <div className="h-[220px] sm:h-[270px] w-full">
            <SafeChartContainer
              height={220}
              empty={funnelDataSafe.length === 0}
              invalid={funnelInvalid}
            >
              <ReBarChart
                data={funnelDataSafe}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--color-border)"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="stage"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "var(--color-text-primary)",
                    fontWeight: 550,
                  }}
                />
                <RechartsTooltip cursor={{ fill: "var(--color-background)" }} />
                <Bar
                  dataKey="count"
                  name="Volume"
                  fill="var(--color-pink)"
                  radius={[0, 4, 4, 0]}
                  barSize={26}
                />
              </ReBarChart>
            </SafeChartContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-4.5 pt-2 lg:pt-3">
        <div className="glass-card shadow-sm p-4 lg:p-4.5">
          <h3 className="font-semibold text-text-primary mb-3.5">
            Evolução do NPS
          </h3>
          <div className="h-[200px] sm:h-[220px] w-full">
            <SafeChartContainer height={200} empty={npsDataSafe.length === 0} invalid={npsInvalid}>
              <LineChart
                data={npsDataSafe}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["auto", 100]}
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="NPS"
                  stroke="var(--color-success)"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </SafeChartContainer>
          </div>
        </div>

        <div className="glass-card shadow-sm p-4 lg:p-4.5">
          <h3 className="font-semibold text-text-primary mb-3.5">
            Inclusões vs Cancelamentos
          </h3>
          <div className="h-[200px] sm:h-[220px] w-full">
            <SafeChartContainer height={200} empty={movementData.length === 0} invalid={movementInvalid}>
              <ReBarChart
                data={[
                  {
                    date: month,
                    Inclusões: summary.additions.current || 0,
                    Cancelamentos: summary.cancellations.current || 0,
                  },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--color-text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip />
                <Legend iconType="circle" />
                <Bar
                  dataKey="Inclusões"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Cancelamentos"
                  fill="var(--color-danger)"
                  radius={[4, 4, 0, 0]}
                />
              </ReBarChart>
            </SafeChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
