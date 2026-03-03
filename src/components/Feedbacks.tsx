import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquareText,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  ChevronDown,
  ChevronRight,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Bug,
  Lightbulb,
  Star,
  AlertTriangle,
  Shield,
  User,
  Mail,
  Phone,
  MapPin,
  Paperclip,
  ArrowLeft,
  BarChart3,
  Filter,
} from 'lucide-react';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

type FeedbackType = 'COMPLAINT' | 'SUGGESTION' | 'BUG' | 'PRAISE';
type FeedbackStatus = 'OPEN' | 'IN_ANALYSIS' | 'RESOLVED' | 'REJECTED';
type FeedbackPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface FeedbackRepresentative {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
}

interface FeedbackResponse {
  id: string;
  feedbackId: string;
  message: string;
  authorType: 'ADMIN' | 'REPRESENTATIVE';
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Feedback {
  id: string;
  representativeId: string;
  representative: FeedbackRepresentative;
  type: FeedbackType;
  subject: string;
  description: string;
  category?: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  attachmentUrl?: string;
  attachmentFileName?: string;
  resolvedAt?: string;
  resolvedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  responses: FeedbackResponse[];
  _count?: { responses: number };
}

interface FeedbackMetrics {
  total: number;
  open: number;
  inAnalysis: number;
  resolved: number;
  rejected: number;
  byType: { type: FeedbackType; count: number }[];
  byPriority: { priority: FeedbackPriority; count: number }[];
  avgResolutionHours: number;
}

// ─── Config Maps ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: any; bg: string; text: string; border: string; dot: string }> = {
  COMPLAINT: { label: 'Reclamação', icon: AlertTriangle, bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  SUGGESTION: { label: 'Sugestão', icon: Lightbulb, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  BUG: { label: 'Bug', icon: Bug, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  PRAISE: { label: 'Elogio', icon: Star, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; icon: any; bg: string; text: string; border: string; dot: string }> = {
  OPEN: { label: 'Aberto', icon: Clock, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  IN_ANALYSIS: { label: 'Em Análise', icon: Eye, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  RESOLVED: { label: 'Resolvido', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Recusado', icon: XCircle, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
};

const PRIORITY_CONFIG: Record<FeedbackPriority, { label: string; bg: string; text: string; border: string; dot: string }> = {
  LOW: { label: 'Baixa', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Média', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400' },
  HIGH: { label: 'Alta', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  CRITICAL: { label: 'Crítica', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

// ─── Badge Components ────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: FeedbackType }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: FeedbackStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: FeedbackPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Response Modal ──────────────────────────────────────────────────────────

interface ResponseModalProps {
  open: boolean;
  onClose: () => void;
  feedbackId: string;
  onSuccess: () => void;
}

function ResponseModal({ open, onClose, feedbackId, onSuccess }: ResponseModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post(`/feedbacks/admin/${feedbackId}/respond`, { message });
      setMessage('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar resposta');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[5001] flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl shadow-black/20 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-2xl">
                <Send className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 leading-tight">Responder Feedback</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mensagem ao representante</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors group">
              <X className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-white scrollbar-hide">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="group text-left">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2 px-1 group-focus-within:text-accent">Sua Resposta *</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Escreva sua resposta ao representante..."
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-accent/10 focus:border-accent text-slate-900 transition-all outline-none text-sm font-medium resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm animate-shake">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="font-bold">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all text-xs active:scale-95">
              Cancelar
            </button>
            <button
              onClick={handleSubmit as any}
              disabled={loading || !message.trim()}
              className="inline-flex items-center gap-2.5 px-7 py-3 bg-accent text-white font-black rounded-2xl hover:bg-accent-secondary shadow-lg shadow-accent/25 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 group"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 group-hover:translate-x-[2px] transition-transform" />}
              {loading ? 'ENVIANDO...' : 'ENVIAR RESPOSTA'}
            </button>
          </div>
        </div>
      </div>
    </>
    , document.body);
}

// ─── Status Update Modal ─────────────────────────────────────────────────────

interface StatusModalProps {
  open: boolean;
  onClose: () => void;
  feedback: Feedback | null;
  onSuccess: () => void;
}

function StatusModal({ open, onClose, feedback, onSuccess }: StatusModalProps) {
  const [status, setStatus] = useState<FeedbackStatus>('OPEN');
  const [priority, setPriority] = useState<FeedbackPriority>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setPriority(feedback.priority);
    }
  }, [feedback]);

  if (!open || !feedback) return null;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.patch(`/feedbacks/admin/${feedback.id}/status`, { status, priority });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[5001] flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl shadow-black/20 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-2xl">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900 leading-tight">Atualizar Status</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gerenciar feedback</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors group">
              <X className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-white scrollbar-hide space-y-5">
            {/* Status */}
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 px-1">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-bold transition-all ${status === s ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-offset-1 ring-current` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <Icon className="h-4 w-4" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority */}
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-3 px-1">Prioridade</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PRIORITY_CONFIG) as FeedbackPriority[]).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-bold transition-all ${priority === p ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-offset-1 ring-current` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm animate-shake">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="font-bold">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all text-xs active:scale-95">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2.5 px-7 py-3 bg-accent text-white font-black rounded-2xl hover:bg-accent-secondary shadow-lg shadow-accent/25 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 group"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
            </button>
          </div>
        </div>
      </div>
    </>
    , document.body);
}

// ─── Detail View ─────────────────────────────────────────────────────────────

interface DetailViewProps {
  feedbackId: string;
  onBack: () => void;
  onRefreshList: () => void;
}

function DetailView({ feedbackId, onBack, onRefreshList }: DetailViewProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const toast = useToast();

  const loadFeedback = async () => {
    try {
      const data = await api.get(`/feedbacks/admin/${feedbackId}`);
      setFeedback(data as any);
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao carregar feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFeedback(); }, [feedbackId]);

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/feedbacks/admin/${feedbackId}`);
      toast.showSuccess('Feedback excluído com sucesso.');
      onRefreshList();
      onBack();
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao excluir feedback');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Feedback não encontrado</h3>
        <button onClick={onBack} className="mt-4 text-accent hover:text-accent-secondary font-semibold text-sm transition-colors">
          ← Voltar à lista
        </button>
      </div>
    );
  }

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

      {/* Back Button + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-accent transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Voltar para lista
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm shadow-sm"
          >
            <Shield className="h-4 w-4" />
            Alterar Status
          </button>
          <button
            onClick={() => setShowResponseModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-semibold rounded-xl hover:bg-accent-secondary transition-colors text-sm shadow-sm shadow-accent/20"
          >
            <Send className="h-4 w-4" />
            Responder
          </button>
        </div>
      </div>

      {/* Feedback Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <TypeBadge type={feedback.type} />
            <StatusBadge status={feedback.status} />
            <PriorityBadge priority={feedback.priority} />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 mb-2">{feedback.subject}</h2>
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{feedback.description}</p>

          {feedback.category && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Categoria: {feedback.category}
              </span>
            </div>
          )}

          {feedback.attachmentUrl && (
            <a
              href={feedback.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-accent/5 border border-accent/20 rounded-xl text-accent text-sm font-semibold hover:bg-accent/10 transition-colors"
            >
              <Paperclip className="h-4 w-4" />
              {feedback.attachmentFileName || 'Ver anexo'}
            </a>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-400">
            <span>Criado em {new Date(feedback.createdAt).toLocaleString('pt-BR')}</span>
            {feedback.resolvedAt && (
              <span className="text-emerald-500">Resolvido em {new Date(feedback.resolvedAt).toLocaleString('pt-BR')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Representative Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-accent" />
          Representante
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            <span className="font-semibold">{feedback.representative.name}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Mail className="h-4 w-4 text-slate-400" />
            <span>{feedback.representative.email}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Phone className="h-4 w-4 text-slate-400" />
            <span>{feedback.representative.phone}</span>
          </div>
          {(feedback.representative.city || feedback.representative.state) && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{[feedback.representative.city, feedback.representative.state].filter(Boolean).join(' - ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Thread / Responses */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-display font-bold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquareText className="h-4 w-4 text-accent" />
          Conversa ({feedback.responses?.length || 0} {feedback.responses?.length === 1 ? 'resposta' : 'respostas'})
        </h3>

        {(!feedback.responses || feedback.responses.length === 0) ? (
          <div className="text-center py-8">
            <MessageSquareText className="mx-auto h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Nenhuma resposta ainda</p>
            <button
              onClick={() => setShowResponseModal(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent font-semibold hover:text-accent-secondary transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar primeira resposta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.responses.map(resp => (
              <div
                key={resp.id}
                className={`rounded-2xl p-4 border ${resp.authorType === 'ADMIN'
                  ? 'bg-accent/5 border-accent/15 ml-4 sm:ml-8'
                  : 'bg-slate-50 border-slate-200 mr-4 sm:mr-8'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{resp.authorName}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${resp.authorType === 'ADMIN'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-slate-200 text-slate-600'
                      }`}>
                      {resp.authorType === 'ADMIN' ? 'Admin' : 'Representante'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{new Date(resp.createdAt).toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{resp.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-display font-bold text-rose-700 mb-1">Zona de Perigo</h3>
            <p className="text-xs text-slate-500">Esta ação não pode ser desfeita.</p>
          </div>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl hover:bg-rose-100 transition-colors text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Feedback
          </button>
        </div>
      </div>

      {/* Modals */}
      <ResponseModal
        open={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        feedbackId={feedbackId}
        onSuccess={() => loadFeedback()}
      />
      <StatusModal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        feedback={feedback}
        onSuccess={() => { loadFeedback(); onRefreshList(); }}
      />
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | ''>('');
  const [filterType, setFilterType] = useState<FeedbackType | ''>('');
  const [filterPriority, setFilterPriority] = useState<FeedbackPriority | ''>('');
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const toast = useToast();

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);
      if (filterPriority) params.append('priority', filterPriority);
      const query = params.toString();
      const data = await api.get(`/feedbacks/admin${query ? `?${query}` : ''}`);
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao carregar feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await api.get('/feedbacks/admin/metrics');
      setMetrics(data as any);
    } catch {
      // Silently handle
    }
  };

  useEffect(() => { loadMetrics(); }, []);
  useEffect(() => { loadFeedbacks(); }, [filterStatus, filterType, filterPriority]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este feedback?')) return;
    try {
      await api.delete(`/feedbacks/admin/${id}`);
      toast.showSuccess('Feedback excluído.');
      loadFeedbacks();
      loadMetrics();
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao excluir');
    }
  };

  // Filter by search
  const filtered = feedbacks.filter(fb => {
    if (!search) return true;
    const q = search.toLowerCase();
    return fb.subject.toLowerCase().includes(q) ||
      fb.representative?.name?.toLowerCase().includes(q) ||
      fb.description?.toLowerCase().includes(q);
  });

  const hasActiveFilters = filterStatus || filterType || filterPriority;
  const clearFilters = () => { setFilterStatus(''); setFilterType(''); setFilterPriority(''); };

  // If a feedback is selected, show detail view
  if (selectedFeedbackId) {
    return (
      <>
        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toast.toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} />
            </div>
          ))}
        </div>
        <DetailView
          feedbackId={selectedFeedbackId}
          onBack={() => setSelectedFeedbackId(null)}
          onRefreshList={() => { loadFeedbacks(); loadMetrics(); }}
        />
      </>
    );
  }

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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl">
            <MessageSquareText className="h-7 w-7 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Feedbacks</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {metrics ? `${metrics.total} feedbacks · ${metrics.open} abertos` : 'Gerenciamento de feedbacks'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => { setFilterStatus(''); clearFilters(); }}
            className={`rounded-2xl p-4 text-center border transition-all ${!filterStatus ? 'bg-accent/5 border-accent/20 ring-2 ring-accent/10' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
          >
            <div className="flex justify-center mb-1">
              <BarChart3 className={`h-5 w-5 ${!filterStatus ? 'text-accent' : 'text-slate-400'}`} />
            </div>
            <p className={`text-2xl font-display font-bold ${!filterStatus ? 'text-accent' : 'text-slate-700'}`}>{metrics.total}</p>
            <p className={`text-xs font-medium mt-0.5 ${!filterStatus ? 'text-accent' : 'text-slate-500'}`}>Total</p>
          </button>

          {(Object.keys(STATUS_CONFIG) as FeedbackStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            const countMap: Record<FeedbackStatus, number> = {
              OPEN: metrics.open,
              IN_ANALYSIS: metrics.inAnalysis,
              RESOLVED: metrics.resolved,
              REJECTED: metrics.rejected,
            };
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                className={`rounded-2xl p-4 text-center border transition-all ${filterStatus === s ? `${cfg.bg} ${cfg.border} ring-2 ring-offset-1 ring-current ${cfg.text}` : 'bg-white border-slate-200 hover:bg-slate-50'}`}
              >
                <div className="flex justify-center mb-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                </div>
                <p className={`text-2xl font-display font-bold ${filterStatus === s ? cfg.text : 'text-slate-700'}`}>{countMap[s]}</p>
                <p className={`text-xs font-medium mt-0.5 ${filterStatus === s ? cfg.text : 'text-slate-500'}`}>{cfg.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Average Resolution Time */}
      {metrics && metrics.avgResolutionHours > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl">
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Tempo médio de resolução</p>
            <p className="text-lg font-display font-bold text-slate-900">{metrics.avgResolutionHours.toFixed(1)}h</p>
          </div>
        </div>
      )}

      {/* Type & Priority distribution */}
      {metrics && (metrics.byType?.length > 0 || metrics.byPriority?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* By Type */}
          {metrics.byType?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Por Tipo</h3>
              <div className="space-y-2">
                {metrics.byType.map(t => {
                  const cfg = TYPE_CONFIG[t.type];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  const pct = metrics.total > 0 ? (t.count / metrics.total) * 100 : 0;
                  return (
                    <button
                      key={t.type}
                      onClick={() => setFilterType(filterType === t.type ? '' : t.type)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${filterType === t.type ? `${cfg.bg} ${cfg.border} border` : 'hover:bg-slate-50'}`}
                    >
                      <Icon className={`h-4 w-4 ${cfg.text}`} />
                      <span className={`text-sm font-semibold flex-1 text-left ${filterType === t.type ? cfg.text : 'text-slate-700'}`}>{cfg.label}</span>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-500 w-8 text-right">{t.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Priority */}
          {metrics.byPriority?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Por Prioridade</h3>
              <div className="space-y-2">
                {metrics.byPriority.map(p => {
                  const cfg = PRIORITY_CONFIG[p.priority];
                  if (!cfg) return null;
                  const pct = metrics.total > 0 ? (p.count / metrics.total) * 100 : 0;
                  return (
                    <button
                      key={p.priority}
                      onClick={() => setFilterPriority(filterPriority === p.priority ? '' : p.priority)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${filterPriority === p.priority ? `${cfg.bg} ${cfg.border} border` : 'hover:bg-slate-50'}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <span className={`text-sm font-semibold flex-1 text-left ${filterPriority === p.priority ? cfg.text : 'text-slate-700'}`}>{cfg.label}</span>
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.dot}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-500 w-8 text-right">{p.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search + Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por assunto, representante..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative group">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as FeedbackType | '')}
              className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all cursor-pointer"
            >
              <option value="">Tipo</option>
              {(Object.keys(TYPE_CONFIG) as FeedbackType[]).map(t => (
                <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative group">
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as FeedbackPriority | '')}
              className="appearance-none pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all cursor-pointer"
            >
              <option value="">Prioridade</option>
              {(Object.keys(PRIORITY_CONFIG) as FeedbackPriority[]).map(p => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Filtros ativos:</span>
          {filterStatus && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[filterStatus].bg} ${STATUS_CONFIG[filterStatus].text} ${STATUS_CONFIG[filterStatus].border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[filterStatus].dot}`} />
              {STATUS_CONFIG[filterStatus].label}
              <button onClick={() => setFilterStatus('')} className="ml-1 hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {filterType && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${TYPE_CONFIG[filterType].bg} ${TYPE_CONFIG[filterType].text} ${TYPE_CONFIG[filterType].border}`}>
              {TYPE_CONFIG[filterType].label}
              <button onClick={() => setFilterType('')} className="ml-1 hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          {filterPriority && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${PRIORITY_CONFIG[filterPriority].bg} ${PRIORITY_CONFIG[filterPriority].text} ${PRIORITY_CONFIG[filterPriority].border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_CONFIG[filterPriority].dot}`} />
              {PRIORITY_CONFIG[filterPriority].label}
              <button onClick={() => setFilterPriority('')} className="ml-1 hover:opacity-70"><X className="h-3 w-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors ml-1">
            Limpar todos
          </button>
        </div>
      )}

      {/* Feedback List */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <MessageSquareText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Nenhum feedback encontrado</h3>
          <p className="text-slate-500 text-sm mb-4">
            {feedbacks.length === 0 ? 'Ainda não há feedbacks dos representantes.' : 'Tente ajustar os filtros.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(fb => (
            <div
              key={fb.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 cursor-pointer group"
              onClick={() => setSelectedFeedbackId(fb.id)}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Left - Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <TypeBadge type={fb.type} />
                    <StatusBadge status={fb.status} />
                    <PriorityBadge priority={fb.priority} />
                  </div>
                  <h3 className="text-base font-display font-bold text-slate-900 truncate group-hover:text-accent transition-colors">{fb.subject}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1">{fb.description}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {fb.representative?.name || 'Representante'}
                    </span>
                    <span>·</span>
                    <span>{new Date(fb.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    {(fb._count?.responses || fb.responses?.length || 0) > 0 && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 text-accent font-semibold">
                          <MessageSquareText className="h-3 w-3" />
                          {fb._count?.responses || fb.responses?.length || 0} {(fb._count?.responses || fb.responses?.length || 0) === 1 ? 'resposta' : 'respostas'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(fb.id); }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all hidden sm:block" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
