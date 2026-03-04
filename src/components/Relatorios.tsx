import { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Loader2,
  Users,
  DollarSign,
  Award,
  Calendar,
  Filter,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Representative {
  id: string;
  name: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function downloadReport(endpoint: string, filename: string) {
  const token = localStorage.getItem('accessToken');
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.pagluz.com.br';

  const res = await fetch(`${baseURL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    let msg = 'Erro ao gerar relatório';
    try { const e = JSON.parse(errText); msg = e.message || msg; } catch { }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Relatorios() {
  const [loading, setLoading] = useState<string | null>(null);
  const [reps, setReps] = useState<Representative[]>([]);
  const [filters, setFilters] = useState({
    representativeId: '',
    startDate: '',
    endDate: '',
    status: '',
    concessionaire: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/representatives')
      .then((data: any) => setReps(Array.isArray(data) ? data : (data?.representatives || [])))
      .catch(() => { });
  }, []);

  const buildQuery = (extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (filters.representativeId) params.append('representativeId', filters.representativeId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.concessionaire) params.append('concessionaire', filters.concessionaire);
    if (extra) Object.entries(extra).forEach(([k, v]) => params.append(k, v));
    const q = params.toString();
    return q ? `?${q}` : '';
  };

  const exportReport = async (type: 'commissions' | 'consumers' | 'representatives') => {
    setLoading(type);
    try {
      const now = new Date().toISOString().slice(0, 10);
      switch (type) {
        case 'commissions':
          await downloadReport(`/reports/commissions${buildQuery()}`, `relatorio_comissoes_${now}.xlsx`);
          break;
        case 'consumers':
          await downloadReport(`/reports/consumers${buildQuery()}`, `relatorio_consumidores_${now}.xlsx`);
          break;
        case 'representatives':
          await downloadReport('/reports/representatives', `relatorio_representantes_${now}.xlsx`);
          break;
      }
      toast.showSuccess('Relatório exportado com sucesso!');
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao exportar relatório');
    }
    setLoading(null);
  };

  const cards = [
    {
      id: 'commissions' as const,
      icon: DollarSign,
      title: 'Comissões',
      description: 'Todos os valores, status e detalhes de comissões',
      gradient: 'from-emerald-600 to-teal-700',
      shadow: 'shadow-emerald-500/25',
    },
    {
      id: 'consumers' as const,
      icon: Users,
      title: 'Consumidores',
      description: 'Dados completos com alocação, status e concessionária',
      gradient: 'from-blue-600 to-indigo-700',
      shadow: 'shadow-blue-500/25',
    },
    {
      id: 'representatives' as const,
      icon: Award,
      title: 'Representantes',
      description: 'Ranking, métricas de performance e resultados',
      gradient: 'from-violet-600 to-purple-700',
      shadow: 'shadow-violet-500/25',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl">
            <FileSpreadsheet className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Relatórios</h1>
            <p className="text-slate-500 text-sm mt-0.5">Exporte dados em planilha Excel (.xlsx)</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold rounded-xl transition-all text-sm border ${showFilters ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
        >
          <Filter className="h-4 w-4" />
          Filtros
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-display font-bold text-slate-900 flex items-center gap-2">
              <Filter className="h-4 w-4 text-accent" />
              Filtros do Relatório
            </h3>
            <button onClick={() => setFilters({ representativeId: '', startDate: '', endDate: '', status: '', concessionaire: '' })} className="text-xs text-slate-400 hover:text-slate-600 font-medium">
              Limpar filtros
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Representante</label>
              <div className="relative">
                <select value={filters.representativeId} onChange={e => setFilters({ ...filters, representativeId: e.target.value })} className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all cursor-pointer pr-10">
                  <option value="">Todos</option>
                  {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Data Início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Data Fim</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Status</label>
              <div className="relative">
                <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all cursor-pointer pr-10">
                  <option value="">Todos</option>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Concessionária</label>
              <input value={filters.concessionaire} onChange={e => setFilters({ ...filters, concessionaire: e.target.value })} placeholder="Ex: CEMIG, CPFL" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
            </div>
          </div>
        </div>
      )}

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          const isLoading = loading === card.id;
          return (
            <button
              key={card.id}
              onClick={() => exportReport(card.id)}
              disabled={!!loading}
              className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all group disabled:opacity-70
                bg-gradient-to-br ${card.gradient} text-white shadow-xl ${card.shadow}
                hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <div className="p-3 bg-white/15 rounded-xl w-fit mb-4">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-display font-bold mb-1 text-white">{card.title}</h3>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">{card.description}</p>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-colors">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 group-hover:translate-y-[1px] transition-transform" />
                      Baixar Excel
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-500 font-display font-semibold mb-1">Sobre os relatórios</p>
          <p className="text-sm text-blue-500/80 leading-relaxed">
            Os relatórios são gerados em formato Excel (.xlsx) e incluem todos os dados filtrados.
            Use os filtros acima para refinar os dados antes de exportar.
          </p>
        </div>
      </div>
    </div>
  );
}
