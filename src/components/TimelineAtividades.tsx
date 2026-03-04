import { useState, useEffect } from 'react';
import {
  Activity,
  Loader2,
  ChevronDown,
  Filter,
  Users,
  DollarSign,
  Zap,
  UserCheck,
  FileText,
  PlusCircle,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Edit,
  ArrowRightCircle,
  Clock,
} from 'lucide-react';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ActivityItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  performedByName?: string;
  performedByRole?: string;
  metadata?: any;
  createdAt: string;
}

interface Stats {
  totalActivities: number;
  byEntityType: { type: string; count: number }[];
  byAction: { action: string; count: number }[];
}

interface Representative { id: string; name: string; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; icon: typeof PlusCircle; color: string; bg: string }> = {
  CREATED: { label: 'Criado', icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  UPDATED: { label: 'Atualizado', icon: Edit, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  STATUS_CHANGED: { label: 'Status Alterado', icon: ArrowRightCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  DELETED: { label: 'Excluído', icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
};

const ENTITY_CONFIG: Record<string, { label: string; icon: typeof Users }> = {
  Consumer: { label: 'Consumidor', icon: Users },
  Commission: { label: 'Comissão', icon: DollarSign },
  Generator: { label: 'Gerador', icon: Zap },
  Representative: { label: 'Representante', icon: UserCheck },
  ProposalRequest: { label: 'Proposta', icon: FileText },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TimelineAtividades() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reps, setReps] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    representativeId: '',
    limit: 100,
  });
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.action) params.action = filters.action;
      if (filters.representativeId) params.representativeId = filters.representativeId;
      params.limit = String(filters.limit);

      const qs = new URLSearchParams(params).toString();

      const [actsData, statsData, repsData] = await Promise.all([
        api.get(`/activity-log/admin?${qs}`).catch(() => []),
        api.get('/activity-log/admin/stats?days=30').catch(() => null),
        api.get('/representatives').catch(() => []),
      ]);
      setActivities(Array.isArray(actsData) ? actsData : []);
      setStats(statsData);
      setReps(Array.isArray(repsData) ? repsData : (repsData as any)?.representatives || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [filters]);

  const groupByDate = (items: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};
    items.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const grouped = groupByDate(activities);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (<div key={t.id} className="pointer-events-auto"><Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} /></div>))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl"><Activity className="h-7 w-7 text-accent" /></div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Timeline de Atividades</h1>
            <p className="text-slate-500 text-sm mt-0.5">Histórico global de ações do sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-500"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 px-4 py-2.5 font-semibold rounded-xl transition-all text-sm border ${showFilters ? 'bg-accent text-white border-accent' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
            <Filter className="h-4 w-4" /> Filtros
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center">
            <p className="text-2xl font-display font-bold text-slate-900">{stats.totalActivities}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1">Total (30d)</p>
          </div>
          {stats.byEntityType?.slice(0, 5).map(t => {
            const cfg = ENTITY_CONFIG[t.type];
            const Icon = cfg?.icon || Activity;
            return (
              <div key={t.type} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 text-center cursor-pointer hover:border-accent/30 transition-colors" onClick={() => setFilters({ ...filters, entityType: t.type })}>
                <Icon className="h-5 w-5 text-accent mx-auto mb-1" />
                <p className="text-xl font-display font-bold text-slate-900">{t.count}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{cfg?.label || t.type}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-bold text-slate-900 flex items-center gap-2"><Filter className="h-4 w-4 text-accent" /> Filtros</h3>
            <button onClick={() => setFilters({ entityType: '', action: '', representativeId: '', limit: 100 })} className="text-xs text-slate-400 hover:text-slate-600 font-medium">Limpar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Entidade</label>
              <div className="relative">
                <select value={filters.entityType} onChange={e => setFilters({ ...filters, entityType: e.target.value })} className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all pr-10">
                  <option value="">Todas</option>
                  {Object.entries(ENTITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Ação</label>
              <div className="relative">
                <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all pr-10">
                  <option value="">Todas</option>
                  {Object.entries(ACTION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Representante</label>
              <div className="relative">
                <select value={filters.representativeId} onChange={e => setFilters({ ...filters, representativeId: e.target.value })} className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all pr-10">
                  <option value="">Todos</option>
                  {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Activity className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Nenhuma atividade encontrada</h3>
          <p className="text-slate-500 text-sm">Tente alterar os filtros selecionados.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-display font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> {date}
              </h3>
              <div className="relative ml-4 border-l-2 border-slate-200 space-y-3 pl-6">
                {items.map(act => {
                  const actionCfg = ACTION_CONFIG[act.action] || { label: act.action, icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
                  const entityCfg = ENTITY_CONFIG[act.entityType];
                  const AIcon = actionCfg.icon;
                  return (
                    <div key={act.id} className="relative">
                      {/* Dot */}
                      <div className={`absolute -left-[33px] top-4 w-4 h-4 rounded-full border-2 border-white ${actionCfg.color.replace('text-', 'bg-')}`} />
                      {/* Card */}
                      <div className={`border rounded-xl p-4 ${actionCfg.bg} transition-all hover:shadow-sm`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-white/80 ${actionCfg.color}`}>
                              <AIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`text-xs font-black uppercase tracking-wider ${actionCfg.color}`}>{actionCfg.label}</span>
                                <span className="text-xs font-bold text-slate-500">{entityCfg?.label || act.entityType}</span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{act.description}</p>
                              {act.performedByName && (
                                <p className="text-xs text-slate-400 mt-1.5 font-medium">
                                  {act.performedByRole === 'ADMIN' ? '👨‍💼' : '👤'} {act.performedByName}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                            {new Date(act.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
