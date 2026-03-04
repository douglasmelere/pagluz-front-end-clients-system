import { useState, useEffect } from 'react';
import {
  BarChart3,
  Loader2,
  ChevronDown,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Building2,
  MapPin,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FullDashboard {
  consumerGrowth: { month: string; total: number; converted: number }[];
  commissionGrowth: { month: string; paidValue: number; pendingValue: number; total: number }[];
  kwhEvolution: { month: string; totalKwh: number; allocatedKwh: number }[];
  concessionaireDistribution: { concessionaire: string; count: number }[];
  consumerTypeDistribution: { type: string; label: string; count: number }[];
  geographicDistribution: { city: string; state: string; count: number }[];
}

interface Representative { id: string; name: string; }

// ─── Color Palette ───────────────────────────────────────────────────────────

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// ─── Chart Card ─────────────────────────────────────────────────────────────

function ChartCard({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden">
      <h3 className="flex items-center gap-2 text-sm font-display font-bold text-slate-900 mb-4">
        <Icon className="h-4.5 w-4.5 text-accent" />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-display font-bold text-slate-900 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold text-slate-900">
            {typeof p.value === 'number' && p.name?.includes('R$')
              ? `R$ ${p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : p.value?.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DashboardAvancado() {
  const [data, setData] = useState<FullDashboard | null>(null);
  const [reps, setReps] = useState<Representative[]>([]);
  const [months, setMonths] = useState(12);
  const [repId, setRepId] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { months: String(months) };
    if (repId) params.representativeId = repId;
    const qs = new URLSearchParams(params).toString();

    Promise.all([
      api.get(`/advanced-dashboard/admin/full?${qs}`).catch(() => null),
      api.get('/representatives').catch(() => []),
    ]).then(([dashData, repsData]) => {
      setData(dashData);
      setReps(Array.isArray(repsData) ? repsData : (repsData as any)?.representatives || []);
    }).finally(() => setLoading(false));
  }, [months, repId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (<div key={t.id} className="pointer-events-auto"><Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} /></div>))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl"><BarChart3 className="h-7 w-7 text-accent" /></div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Dashboard Avançado</h1>
            <p className="text-slate-500 text-sm mt-0.5">Análise detalhada com gráficos interativos</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select value={months} onChange={e => setMonths(+e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all cursor-pointer">
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
              <option value={24}>24 meses</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={repId} onChange={e => setRepId(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all cursor-pointer max-w-[200px]">
              <option value="">Todos os representantes</option>
              {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-accent" /></div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Sem dados disponíveis</h3>
          <p className="text-slate-500 text-sm">Não há dados suficientes para gerar os gráficos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Consumer Growth - Area Chart */}
          {data.consumerGrowth?.length > 0 && (
            <ChartCard title="Evolução de Clientes" icon={TrendingUp}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.consumerGrowth}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradConverted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" stroke="#2563EB" fill="url(#gradTotal)" name="Novos" strokeWidth={2} />
                  <Area type="monotone" dataKey="converted" stroke="#10B981" fill="url(#gradConverted)" name="Convertidos" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Commission Growth - Bar Chart */}
          {data.commissionGrowth?.length > 0 && (
            <ChartCard title="Comissões por Mês" icon={DollarSign}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.commissionGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="paidValue" fill="#10B981" name="Pagas (R$)" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pendingValue" fill="#F59E0B" name="Pendentes (R$)" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* kWh Evolution - Line Chart */}
          {data.kwhEvolution?.length > 0 && (
            <ChartCard title="Evolução kWh Alocado" icon={Zap}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.kwhEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="totalKwh" stroke="#2563EB" name="Total kWh" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB' }} />
                  <Line type="monotone" dataKey="allocatedKwh" stroke="#10B981" name="Alocado kWh" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Concessionaire Distribution - Pie Chart */}
          {data.concessionaireDistribution?.length > 0 && (
            <ChartCard title="Por Concessionária" icon={Building2}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.concessionaireDistribution} dataKey="count" nameKey="concessionaire" cx="50%" cy="50%" outerRadius={100} innerRadius={45} label={({ concessionaire, count }) => `${concessionaire} (${count})`} labelLine={{ stroke: '#94a3b8' }} strokeWidth={2} stroke="#fff">
                    {data.concessionaireDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Consumer Type Distribution - Horizontal Bar */}
          {data.consumerTypeDistribution?.length > 0 && (
            <ChartCard title="Por Tipo de Consumidor" icon={Users}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.consumerTypeDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis dataKey="label" type="category" width={110} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8B5CF6" name="Quantidade" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Geographic Distribution - Table */}
          {data.geographicDistribution?.length > 0 && (
            <ChartCard title="Distribuição Geográfica" icon={MapPin}>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-200">
                      <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Cidade</th>
                      <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">UF</th>
                      <th className="pb-2 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Consumidores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.geographicDistribution.slice(0, 15).map((g, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 text-sm font-semibold text-slate-900">{g.city}</td>
                        <td className="py-2.5 text-sm text-slate-500 text-center">{g.state}</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-accent/10 text-accent">{g.count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}
