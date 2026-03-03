import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Users,
  User,
  ChevronDown,
} from 'lucide-react';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface Representative {
  id: string;
  name: string;
  email: string;
}

interface ComunicadoRead {
  representativeId: string;
  readAt: string;
  representative?: { name: string };
}

interface Comunicado {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  representativeId?: string;
  representative?: Representative;
  reads?: ComunicadoRead[];
  createdAt: string;
}

// ─── Priority Config ─────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; bg: string; text: string; border: string; dot: string }> = {
  LOW: { label: 'Baixa', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400' },
  NORMAL: { label: 'Normal', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  HIGH: { label: 'Alta', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  URGENT: { label: 'Urgente', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
};

// ─── Create Modal ────────────────────────────────────────────────────────────

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateModal({ open, onClose, onSuccess }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [representativeId, setRepresentativeId] = useState('');
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      api.get('/representatives').then((data: any) => {
        setRepresentatives(Array.isArray(data) ? data : (data?.representatives || []));
      }).catch(() => { });
    }
  }, [open]);

  const reset = () => {
    setTitle(''); setMessage(''); setPriority('NORMAL'); setTarget('all'); setRepresentativeId(''); setError('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    if (target === 'specific' && !representativeId) {
      setError('Selecione um representante.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await api.post('/announcements', {
        title: title.trim(),
        message: message.trim(),
        priority,
        ...(target === 'specific' ? { representativeId } : {}),
      });
      onSuccess();
      onClose();
      reset();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar comunicado');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop - cobre 100% da viewport sem nenhum padding */}
      <div
        className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      {/* Wrapper centralizado por cima do backdrop */}
      <div className="fixed inset-0 z-[5001] flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl shadow-black/20 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-2xl">
                <Megaphone className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 leading-tight">Novo Comunicado</h2>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider opacity-70">Aviso para a equipe</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-white translate-z-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="group text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 px-1 group-focus-within:text-accent transition-colors">Título do Comunicado *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Reunião de alinhamento"
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-900 placeholder:text-slate-400 transition-all outline-none text-sm font-semibold"
                />
              </div>

              {/* Message */}
              <div className="group text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 px-1 group-focus-within:text-accent transition-colors">Mensagem *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Escreva aqui o conteúdo do aviso..."
                  rows={5}
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-900 placeholder:text-slate-400 transition-all outline-none text-sm font-semibold resize-none min-h-[140px]"
                />
              </div>

              {/* Priority Select */}
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 px-1">Nível de Prioridade</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => {
                    const cfg = PRIORITY_CONFIG[p];
                    const isActive = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`px-3 py-3 rounded-xl border text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2 group ${isActive
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-4 ring-offset-0 ring-current/10 shadow-sm`
                          : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                          }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full shadow-sm transition-transform group-hover:scale-125 ${isActive ? cfg.dot : 'bg-slate-200'}`} />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Targeting */}
              <div className="text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 px-1">Público Alvo</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className={`flex-1 flex items-center gap-3 px-4 py-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${target === 'all' ? 'border-accent bg-accent/5 ring-4 ring-accent/10' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${target === 'all' ? 'border-accent bg-accent' : 'border-slate-200 bg-white'}`}>
                      {target === 'all' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                    </div>
                    <input type="radio" value="all" checked={target === 'all'} onChange={() => setTarget('all')} className="hidden" />
                    <Users className={`h-5 w-5 ${target === 'all' ? 'text-accent' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${target === 'all' ? 'text-accent' : 'text-slate-600'}`}>Todos</span>
                  </label>

                  <label className={`flex-1 flex items-center gap-3 px-4 py-4 rounded-2xl border cursor-pointer transition-all shadow-sm ${target === 'specific' ? 'border-accent bg-accent/5 ring-4 ring-accent/10' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${target === 'specific' ? 'border-accent bg-accent' : 'border-slate-200 bg-white'}`}>
                      {target === 'specific' && <div className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                    </div>
                    <input type="radio" value="specific" checked={target === 'specific'} onChange={() => setTarget('specific')} className="hidden" />
                    <User className={`h-5 w-5 ${target === 'specific' ? 'text-accent' : 'text-slate-400'}`} />
                    <span className={`text-sm font-bold ${target === 'specific' ? 'text-accent' : 'text-slate-600'}`}>Específico</span>
                  </label>
                </div>
              </div>

              {/* Representative Selection */}
              {target === 'specific' && (
                <div className="animate-fade-in group text-left">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 px-1 group-focus-within:text-accent">Selecionar Representante *</label>
                  <div className="relative">
                    <select
                      value={representativeId}
                      onChange={e => setRepresentativeId(e.target.value)}
                      required
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-900 transition-all outline-none text-sm font-bold appearance-none cursor-pointer"
                    >
                      <option value="">Selecione o destinatário...</option>
                      {representatives.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-focus-within:text-accent" />
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm animate-shake">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all text-xs active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit as any}
              disabled={loading || !title.trim() || !message.trim()}
              className="inline-flex items-center gap-2.5 px-7 py-3 bg-accent text-white font-black rounded-2xl hover:bg-accent-secondary shadow-lg shadow-accent/25 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 group"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Megaphone className="h-4 w-4 group-hover:rotate-12 transition-transform" />}
              {loading ? 'ENVIANDO...' : 'PUBLICAR AGORA'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Read List (expandable) ───────────────────────────────────────────────────

function ReadList({ reads }: { reads: ComunicadoRead[] }) {
  const [open, setOpen] = useState(false);
  if (reads.length === 0) return <span className="text-slate-400 text-xs">Nenhuma leitura registrada</span>;
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-accent transition-colors"
      >
        <Eye className="h-3.5 w-3.5" />
        {reads.length} leitura{reads.length !== 1 ? 's' : ''}
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="mt-2 space-y-1">
          {reads.map(r => (
            <li key={r.representativeId} className="text-xs text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              {r.representative?.name || `ID: ${r.representativeId}`}
              <span className="text-slate-400">·</span>
              {new Date(r.readAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Comunicados() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/announcements');
      setComunicados(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao carregar comunicados');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!window.confirm('Excluir este comunicado?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.showSuccess('Comunicado excluído com sucesso.');
      load();
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao excluir comunicado');
    }
  }

  const filtered = comunicados.filter(c =>
    !filterPriority || c.priority === filterPriority
  );

  const totalLeituras = comunicados.reduce((acc, c) => acc + (c.reads?.length ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl">
            <Megaphone className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Comunicados</h1>
            <p className="text-slate-500 text-sm mt-0.5">{comunicados.length} comunicados enviados · {totalLeituras} leituras</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-secondary transition-colors shadow-sm shadow-accent/20 text-sm"
        >
          <Plus className="h-4 w-4" />
          Novo Comunicado
        </button>
      </div>

      {/* Priority Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => {
          const cfg = PRIORITY_CONFIG[p];
          const count = comunicados.filter(c => c.priority === p).length;
          return (
            <button
              key={p}
              onClick={() => setFilterPriority(filterPriority === p ? '' : p)}
              className={`rounded-2xl p-4 text-center border transition-all ${filterPriority === p ? `${cfg.bg} ${cfg.border} ring-2 ring-offset-1 ring-current ${cfg.text}` : 'bg-white border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="flex justify-center mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              </div>
              <p className={`text-2xl font-display font-bold ${filterPriority === p ? cfg.text : 'text-slate-700'}`}>{count}</p>
              <p className={`text-xs font-medium mt-0.5 ${filterPriority === p ? cfg.text : 'text-slate-500'}`}>{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      {filterPriority && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filtrando por:</span>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${PRIORITY_CONFIG[filterPriority].bg} ${PRIORITY_CONFIG[filterPriority].text} ${PRIORITY_CONFIG[filterPriority].border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[filterPriority].dot}`} />
            {PRIORITY_CONFIG[filterPriority].label}
          </span>
          <button onClick={() => setFilterPriority('')} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Nenhum comunicado encontrado</h3>
          <p className="text-slate-500 text-sm mb-4">
            {comunicados.length === 0 ? 'Envie o primeiro comunicado para sua equipe.' : 'Tente ajustar o filtro de prioridade.'}
          </p>
          {comunicados.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-secondary transition-colors"
            >
              <Megaphone className="h-4 w-4" />
              Criar comunicado
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const priority = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.NORMAL;
            const reads = c.reads ?? [];
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Priority top bar */}
                <div className={`h-1 ${priority.dot}`} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${priority.bg} ${priority.text} ${priority.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                        {priority.label}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.representativeId ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {c.representativeId ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                        {c.representativeId ? 'Específico' : 'Todos'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:block">
                        {new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        title="Excluir comunicado"
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-3">
                    <h3 className="font-display font-semibold text-slate-900">{c.title}</h3>
                    <p className="text-slate-600 text-sm mt-1.5 leading-relaxed whitespace-pre-wrap">{c.message}</p>
                  </div>

                  {/* Recipient info */}
                  {c.representative && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span className="text-slate-400">Para:</span>
                      <span className="font-medium text-slate-700">{c.representative.name}</span>
                      <span className="text-slate-400 text-xs">{c.representative.email}</span>
                    </div>
                  )}

                  {/* Reads */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <ReadList reads={reads} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={load} />

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
