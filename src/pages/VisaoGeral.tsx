import { useSearchParams } from "react-router";
import { KPICard } from "../components/KPICard";
import { Users, Target, BarChart, DollarSign, UserCheck, Star, Zap, Phone, ShieldClose } from "lucide-react";
import { useMonthlyDashboard } from "../hooks/useMonthlyDashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";

export function VisaoGeral() {
  const [searchParams] = useSearchParams();
  const month = searchParams.get("month") || "Maio/2026";
  const { data: dashboardData, loading } = useMonthlyDashboard(month);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { summary, beneficiariesData, funnelData, npsData, cancellationReasons } = dashboardData;
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className="dashboard-content space-y-4 md:space-y-4.5">

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
        <KPICard title="Beneficiários Totais" value={summary.beneficiaries.current} variation={summary.beneficiaries.variation} target={summary.beneficiaries.target} icon={Users} />
        <KPICard title="Novas Inclusões" value={summary.additions.current} variation={summary.additions.variation} target={summary.additions.target} icon={Zap} />
        <KPICard title="Cancelamentos" value={summary.cancellations.current} variation={summary.cancellations.variation} target={summary.cancellations.target} icon={ShieldClose} />
        <KPICard title="Investimento (R$)" value={formatCurrency(summary.investment.current)} variation={summary.investment.variation} icon={DollarSign} />
        <KPICard title="ROI Estimado (%)" value={summary.roi.current} variation={summary.roi.variation} icon={Target} tooltip="Retorno sobre Investimento" />
        
        <KPICard title="Leads Gerados" value={summary.leads.current} variation={summary.leads.variation} target={summary.leads.target} icon={BarChart} />
        <KPICard title="Agendamentos" value={summary.appointments.current} variation={summary.appointments.variation} target={summary.appointments.target} icon={Phone} />
        <KPICard title="Vendas Realizadas" value={summary.sales.current} variation={summary.sales.variation} target={summary.sales.target} icon={UserCheck} />
        <KPICard title="CAC (R$)" value={formatCurrency(summary.cac.current)} variation={summary.cac.variation} icon={DollarSign} tooltip="Custo de Aquisição de Cliente" />
        <KPICard title="NPS" value={summary.nps.current} variation={summary.nps.variation} icon={Star} tooltip="Net Promoter Score" />
      </div>

      <div className="glass-card shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-black text-text-primary">Cancelamentos por motivo</h3>
            <p className="text-[10px] text-text-secondary">Distribuição do mês selecionado</p>
          </div>
          <span className="text-lg font-black text-[#CD176D]">{cancellationReasons.reduce((sum, item) => sum + item.count, 0)}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cancellationReasons.map((item) => (
            <div key={item.reason} className="rounded-xl border border-border bg-white/60 p-3">
              <span className="block text-[10px] font-bold text-text-secondary">{item.reason}</span>
              <span className="block mt-1 text-xl font-black text-text-primary">{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-4.5 pt-2 lg:pt-3">
        {/* Gráfico Principal Largo */}
        <div className="glass-card shadow-sm p-4 lg:p-4.5 lg:col-span-2">
          <h3 className="font-semibold text-text-primary mb-3.5">Evolução de Beneficiários</h3>
          <div className="h-[220px] sm:h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={beneficiariesData?.evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-secondary)'}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
                <Area type="monotone" dataKey="count" name="Beneficiários" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico Secundário Lateral */}
        <div className="glass-card shadow-sm p-4 lg:p-4.5 lg:col-span-1">
          <h3 className="font-semibold text-text-primary mb-3.5">Funil de Conversão</h3>
          <div className="h-[220px] sm:h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: 'var(--color-text-primary)', fontWeight: 550}} />
                <RechartsTooltip cursor={{fill: 'var(--color-background)'}} />
                <Bar dataKey="count" name="Volume" fill="var(--color-pink)" radius={[0, 4, 4, 0]} barSize={26} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-4.5 pt-2 lg:pt-3">
        <div className="glass-card shadow-sm p-4 lg:p-4.5">
           <h3 className="font-semibold text-text-primary mb-3.5">Evolução do NPS</h3>
           <div className="h-[200px] sm:h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={npsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 100]} tick={{fontSize: 12, fill: 'var(--color-text-secondary)'}} axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="score" name="NPS" stroke="var(--color-success)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card shadow-sm p-4 lg:p-4.5">
          <h3 className="font-semibold text-text-primary mb-3.5">Inclusões vs Cancelamentos</h3>
          <div className="h-[200px] sm:h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={npsData.map((d: any, i: number) => ({ date: d.date, Inclusões: 800 + i*50, Cancelamentos: 100 + i*10 }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--color-text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-secondary)'}} axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Legend iconType="circle" />
                <Bar dataKey="Inclusões" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cancelamentos" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
