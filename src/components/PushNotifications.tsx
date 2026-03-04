import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Send,
  Loader2,
  Smartphone,
  Monitor,
  Users,
  ChevronDown,
  CheckCircle2,
  Megaphone,
} from 'lucide-react';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PushStats {
  total: number;
  active: number;
  byPlatform: { platform: string; count: number }[];
}

interface Representative { id: string; name: string; }

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PushNotifications() {
  const [stats, setStats] = useState<PushStats | null>(null);
  const [reps, setReps] = useState<Representative[]>([]);
  const [form, setForm] = useState({ title: '', body: '', representativeId: '' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<'one' | 'all' | null>(null);
  const [showConfirmAll, setShowConfirmAll] = useState(false);
  const [sentHistory, setSentHistory] = useState<{ title: string; target: string; time: Date }[]>([]);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get('/push-notifications/admin/stats').catch(() => null),
      api.get('/representatives').catch(() => []),
    ]).then(([statsData, repsData]) => {
      setStats(statsData);
      setReps(Array.isArray(repsData) ? repsData : (repsData as any)?.representatives || []);
    }).finally(() => setLoading(false));
  }, []);

  const sendToOne = async () => {
    if (!form.representativeId || !form.title || !form.body) {
      toast.showWarning('Preencha todos os campos para enviar');
      return;
    }
    setSending('one');
    try {
      await api.post(`/push-notifications/admin/send/${form.representativeId}`, { title: form.title, body: form.body });
      const repName = reps.find(r => r.id === form.representativeId)?.name || 'Representante';
      toast.showSuccess(`Notificação enviada para ${repName}!`);
      setSentHistory(prev => [{ title: form.title, target: repName, time: new Date() }, ...prev]);
      setForm({ title: '', body: '', representativeId: '' });
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao enviar notificação');
    } finally { setSending(null); }
  };

  const sendToAll = async () => {
    if (!form.title || !form.body) {
      toast.showWarning('Preencha título e mensagem');
      return;
    }
    setSending('all');
    try {
      await api.post('/push-notifications/admin/send-all', { title: form.title, body: form.body });
      toast.showSuccess('Notificação enviada para todos os representantes!');
      setSentHistory(prev => [{ title: form.title, target: 'Todos', time: new Date() }, ...prev]);
      setForm({ title: '', body: '', representativeId: '' });
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao enviar notificação');
    } finally { setSending(null); setShowConfirmAll(false); }
  };

  const platformIcon = (p: string) => {
    if (p === 'android' || p === 'ios') return Smartphone;
    return Monitor;
  };
  const platformLabel = (p: string) => {
    if (p === 'android') return 'Android';
    if (p === 'ios') return 'iOS';
    return 'Web';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (<div key={t.id} className="pointer-events-auto"><Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} /></div>))}
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl"><Bell className="h-7 w-7 text-accent" /></div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Push Notifications</h1>
            <p className="text-slate-500 text-sm mt-0.5">Envie notificações push para os representantes</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
            <Smartphone className="h-6 w-6 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-slate-900">{stats.active}</p>
            <p className="text-[10px] font-display font-black text-slate-400 uppercase tracking-wider mt-1">Tokens Ativos</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
            <Users className="h-6 w-6 text-slate-400 mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-slate-900">{stats.total}</p>
            <p className="text-[10px] font-display font-black text-slate-400 uppercase tracking-wider mt-1">Total</p>
          </div>
          {stats.byPlatform?.map(p => {
            const PIcon = platformIcon(p.platform);
            return (
              <div key={p.platform} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
                <PIcon className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-display font-bold text-slate-900">{p.count}</p>
                <p className="text-[10px] font-display font-black text-slate-400 uppercase tracking-wider mt-1">{platformLabel(p.platform)}</p>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-display font-bold text-slate-900 flex items-center gap-2"><Send className="h-5 w-5 text-accent" /> Enviar Notificação</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Título *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Nova proposta disponível" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
              </div>
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Mensagem *</label>
                <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} placeholder="Digite a mensagem da notificação..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all resize-none" />
              </div>
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Representante (envio individual)</label>
                <div className="relative">
                  <select value={form.representativeId} onChange={e => setForm({ ...form, representativeId: e.target.value })} className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all pr-10">
                    <option value="">Selecione para envio individual...</option>
                    {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={sendToOne} disabled={!!sending || !form.representativeId || !form.title || !form.body} className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-bold rounded-2xl hover:bg-accent-secondary shadow-lg shadow-accent/25 transition-all text-sm disabled:opacity-50 active:scale-95">
                  {sending === 'one' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar para 1
                </button>
                <button onClick={() => setShowConfirmAll(true)} disabled={!!sending || !form.title || !form.body} className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 shadow-lg shadow-rose-500/25 transition-all text-sm disabled:opacity-50 active:scale-95">
                  {sending === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                  Enviar para Todos
                </button>
              </div>
            </div>
          </div>

          {/* Send History (session) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-display font-bold text-slate-900 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Enviados (sessão)</h2>
            </div>
            <div className="p-5">
              {sentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="mx-auto h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">Nenhuma notificação enviada nesta sessão.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentHistory.map((h, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="font-display font-bold text-slate-900 text-sm truncate">{h.title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs font-medium text-slate-500">→ {h.target}</span>
                        <span className="text-xs text-slate-400">{h.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm All Modal */}
      {showConfirmAll && createPortal(
        <>
          <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-[2px] animate-fade-in" onClick={() => setShowConfirmAll(false)} />
          <div className="fixed inset-0 z-[5001] flex items-center justify-center p-4">
            <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl animate-scale-up p-6">
              <div className="text-center mb-6">
                <div className="p-4 bg-rose-50 rounded-2xl w-fit mx-auto mb-4"><Megaphone className="h-8 w-8 text-rose-500" /></div>
                <h2 className="text-xl font-display font-bold text-slate-900">Confirmar envio em massa</h2>
                <p className="text-sm text-slate-500 mt-2">Isso enviará a notificação para <strong>todos</strong> os representantes com tokens ativos.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <p className="text-sm font-display font-bold text-slate-900">{form.title}</p>
                <p className="text-sm text-slate-600 mt-1">{form.body}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmAll(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm">Cancelar</button>
                <button onClick={sendToAll} disabled={!!sending} className="flex-1 px-4 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 shadow-lg shadow-rose-500/25 transition-all text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2">
                  {sending === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Confirmar Envio
                </button>
              </div>
            </div>
          </div>
        </>
        , document.body)}
    </div>
  );
}
