import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trophy,
  Target,
  Medal,
  Loader2,
  X,
  Users,
  Zap,
  DollarSign,
  TrendingUp,
  Calendar,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Plus,
  Star,
  Crown,
  Award,
} from 'lucide-react';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RankedRep {
  id: string;
  name: string;
  email: string;
  city?: string;
  state?: string;
  avatarUrl?: string;
  position: number;
  totalClients: number;
  convertedClients: number;
  totalKwh: number;
  totalCommissions: number;
  conversionRate: number;
  score: number;
}

interface Goal {
  id: string;
  representativeId: string;
  representative?: { name: string };
  title: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: string;
  periodStart: string;
  periodEnd: string;
}

interface Representative { id: string; name: string; }

// ─── Create Goal Modal ──────────────────────────────────────────────────────

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  representatives: Representative[];
  preSelectedRepId?: string;
}

function CreateGoalModal({ open, onClose, onSuccess, representatives, preSelectedRepId }: GoalModalProps) {
  const [form, setForm] = useState({
    representativeId: preSelectedRepId || '',
    title: '',
    type: 'CLIENTS',
    targetValue: 0,
    unit: 'clientes',
    periodStart: '',
    periodEnd: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (preSelectedRepId) setForm(f => ({ ...f, representativeId: preSelectedRepId })); }, [preSelectedRepId]);

  if (!open) return null;

  const typeOptions = [
    { value: 'CLIENTS', label: 'Clientes', icon: Users, unit: 'clientes' },
    { value: 'KWH', label: 'kWh', icon: Zap, unit: 'kWh' },
    { value: 'REVENUE', label: 'Faturamento', icon: DollarSign, unit: 'R$' },
    { value: 'COMMISSION', label: 'Comissão', icon: DollarSign, unit: 'R$' },
  ];

  const handleSubmit = async () => {
    if (!form.representativeId || !form.title || !form.targetValue || !form.periodStart || !form.periodEnd) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/ranking/admin/goals', form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar meta');
    } finally { setLoading(false); }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[5001] flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl shadow-black/20 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-2xl"><Target className="h-5 w-5 text-accent" /></div>
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900">Nova Meta</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Definir objetivo</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Representante *</label>
              <div className="relative">
                <select value={form.representativeId} onChange={e => setForm({ ...form, representativeId: e.target.value })} className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all pr-10">
                  <option value="">Selecione...</option>
                  {representatives.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Título *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Meta Q1 2026" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {typeOptions.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.value} onClick={() => setForm({ ...form, type: t.value, unit: t.unit })} className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-bold transition-all ${form.type === t.value ? 'bg-accent/10 text-accent border-accent/30 ring-2 ring-accent/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <Icon className="h-4 w-4" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Valor Alvo ({form.unit}) *</label>
              <input type="number" value={form.targetValue || ''} onChange={e => setForm({ ...form, targetValue: +e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Início *</label>
                <input type="date" value={form.periodStart} onChange={e => setForm({ ...form, periodStart: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
              </div>
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Fim *</label>
                <input type="date" value={form.periodEnd} onChange={e => setForm({ ...form, periodEnd: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" /><p className="font-bold">{error}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-800 rounded-xl transition-all text-xs">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="inline-flex items-center gap-2.5 px-7 py-3 bg-accent text-white font-black rounded-2xl hover:bg-accent-secondary shadow-lg shadow-accent/25 transition-all text-xs disabled:opacity-50 active:scale-95">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              {loading ? 'CRIANDO...' : 'CRIAR META'}
            </button>
          </div>
        </div>
      </div>
    </>
    , document.body);
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RankingMetas() {
  const [ranking, setRanking] = useState<RankedRep[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reps, setReps] = useState<Representative[]>([]);
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalRepId, setGoalRepId] = useState('');
  const [tab, setTab] = useState<'ranking' | 'goals'>('ranking');
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankData, goalsData, repsData] = await Promise.all([
        api.get(`/ranking/admin/leaderboard?period=${period}`).catch(() => []),
        api.get('/ranking/admin/goals').catch(() => []),
        api.get('/representatives').catch(() => []),
      ]);
      setRanking(Array.isArray(rankData) ? rankData : []);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setReps(Array.isArray(repsData) ? repsData : (repsData as any)?.representatives || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [period]);

  const checkBadges = async (repId: string) => {
    try {
      await api.post(`/ranking/admin/check-badges/${repId}`, {});
      toast.showSuccess('Badges verificadas com sucesso!');
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao verificar badges');
    }
  };

  const podiumIcons = [Crown, Medal, Award];
  const podiumColors = ['text-amber-500', 'text-slate-400', 'text-orange-600'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (<div key={t.id} className="pointer-events-auto"><Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} /></div>))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl"><Trophy className="h-7 w-7 text-accent" /></div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Ranking & Metas</h1>
            <p className="text-slate-500 text-sm mt-0.5">Performance dos representantes e gestão de metas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={period} onChange={e => setPeriod(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all cursor-pointer">
              <option value="week">Semana</option>
              <option value="month">Mês</option>
              <option value="quarter">Trimestre</option>
              <option value="year">Ano</option>
              <option value="all">Geral</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
          <button onClick={() => { setGoalRepId(''); setShowGoalModal(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-secondary transition-colors text-sm shadow-sm shadow-accent/20">
            <Plus className="h-4 w-4" /> Nova Meta
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setTab('ranking')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'ranking' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Trophy className="h-4 w-4 inline-block mr-1.5 -mt-0.5" /> Ranking
        </button>
        <button onClick={() => setTab('goals')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'goals' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Target className="h-4 w-4 inline-block mr-1.5 -mt-0.5" /> Metas ({goals.length})
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : tab === 'ranking' ? (
        <>
          {/* Podium Top 3 */}
          {ranking.length >= 3 && (
            <div className="grid grid-cols-3 gap-4">
              {ranking.slice(0, 3).map((rep, i) => {
                const PIcon = podiumIcons[i];
                return (
                  <div key={rep.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center ${i === 0 ? 'ring-2 ring-amber-300/50' : ''}`}>
                    <PIcon className={`h-8 w-8 mx-auto mb-2 ${podiumColors[i]}`} />
                    <h3 className="font-display font-bold text-slate-900 truncate">{rep.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{rep.city && rep.state ? `${rep.city}/${rep.state}` : ''}</p>
                    <p className="text-2xl font-display font-bold text-accent mt-2">{rep.score}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">pontos</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 rounded-lg p-2"><p className="font-bold text-slate-700">{rep.totalClients}</p><p className="text-slate-400">Clientes</p></div>
                      <div className="bg-slate-50 rounded-lg p-2"><p className="font-bold text-slate-700">{rep.conversionRate}%</p><p className="text-slate-400">Conversão</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Ranking Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider">#</th>
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider">Representante</th>
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Clientes</th>
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Convertidos</th>
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider text-right">kWh</th>
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Comissões</th>
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Conversão</th>
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Score</th>
                    <th className="px-4 py-3.5 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map(rep => (
                    <tr key={rep.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-sm">
                        {rep.position <= 3 ? (
                          <span className="text-lg">{['🥇', '🥈', '🥉'][rep.position - 1]}</span>
                        ) : (
                          <span className="text-slate-400">#{rep.position}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-display font-semibold text-slate-900 text-sm">{rep.name}</div>
                        {rep.city && <div className="text-xs text-slate-400">{rep.city}/{rep.state}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-slate-700">{rep.totalClients}</td>
                      <td className="px-4 py-3.5 text-center text-sm font-semibold text-emerald-600">{rep.convertedClients}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700">{rep.totalKwh.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700">R$ {rep.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3.5 text-center"><span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${rep.conversionRate >= 50 ? 'bg-emerald-50 text-emerald-700' : rep.conversionRate >= 25 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-600'}`}>{rep.conversionRate}%</span></td>
                      <td className="px-4 py-3.5 text-center"><span className="inline-flex px-2.5 py-1 rounded-lg text-sm font-black bg-accent/10 text-accent">{rep.score}</span></td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => { setGoalRepId(rep.id); setShowGoalModal(true); }} className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Criar meta"><Target className="h-4 w-4" /></button>
                          <button onClick={() => checkBadges(rep.id)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Verificar badges"><Medal className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ranking.length === 0 && (
              <div className="p-12 text-center">
                <Trophy className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Nenhum dado de ranking</h3>
                <p className="text-slate-500 text-sm">Tente alterar o período selecionado.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Goals Tab */
        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Target className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Nenhuma meta criada</h3>
              <p className="text-slate-500 text-sm mb-4">Crie metas para acompanhar a performance dos representantes.</p>
              <button onClick={() => { setGoalRepId(''); setShowGoalModal(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-secondary transition-colors">
                <Plus className="h-4 w-4" /> Criar primeira meta
              </button>
            </div>
          ) : goals.map(goal => {
            const pct = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0;
            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-display font-bold text-slate-900">{goal.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{goal.representative?.name || 'Representante'} · {goal.type}</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${goal.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : goal.status === 'EXPIRED' ? 'bg-slate-50 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>
                    {goal.status === 'COMPLETED' ? 'Concluída' : goal.status === 'EXPIRED' ? 'Expirada' : 'Em andamento'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-accent' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-16 text-right">{pct.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>{goal.currentValue.toLocaleString('pt-BR')} / {goal.targetValue.toLocaleString('pt-BR')} {goal.unit}</span>
                  <span>{new Date(goal.periodStart).toLocaleDateString('pt-BR')} → {new Date(goal.periodEnd).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateGoalModal open={showGoalModal} onClose={() => setShowGoalModal(false)} onSuccess={loadData} representatives={reps} preSelectedRepId={goalRepId} />
    </div>
  );
}
