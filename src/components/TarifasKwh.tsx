import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DollarSign,
  Loader2,
  Plus,
  Trash2,
  History,
  X,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import Toast from './common/Toast';

// ─── Types ──────────────────────────────────────────────────────────────────

interface KwhPrice {
  id: string;
  concessionaire: string;
  pricePerKwh: number;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  source?: string;
  notes?: string;
  createdAt: string;
}

// ─── Create Price Modal ──────────────────────────────────────────────────────

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePriceModal({ open, onClose, onSuccess }: CreateModalProps) {
  const [form, setForm] = useState({
    concessionaire: '',
    pricePerKwh: 0,
    effectiveFrom: '',
    source: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!form.concessionaire || !form.pricePerKwh || !form.effectiveFrom) {
      setError('Preencha concessionária, preço e data de início');
      return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/kwh-prices', {
        ...form,
        pricePerKwh: form.pricePerKwh,
      });
      onSuccess();
      onClose();
      setForm({ concessionaire: '', pricePerKwh: 0, effectiveFrom: '', source: '', notes: '' });
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar preço');
    } finally { setLoading(false); }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="fixed inset-0 z-[5001] flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl shadow-black/20 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-accent/10 rounded-2xl"><DollarSign className="h-5 w-5 text-accent" /></div>
              <div>
                <h2 className="text-lg font-display font-bold text-slate-900">Novo Preço kWh</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">O preço vigente anterior será encerrado automaticamente</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-400" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">Ao cadastrar um novo preço, o preço vigente da mesma concessionária será encerrado automaticamente.</p>
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Concessionária *</label>
              <input value={form.concessionaire} onChange={e => setForm({ ...form, concessionaire: e.target.value })} placeholder="Ex: CEMIG, CPFL, ENEL" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Preço por kWh (R$) *</label>
              <input type="number" step="0.0001" value={form.pricePerKwh || ''} onChange={e => setForm({ ...form, pricePerKwh: +e.target.value })} placeholder="0.0000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Vigente a partir de *</label>
              <input type="date" value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Fonte</label>
              <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Ex: ANEEL, manual, resolução N° X" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all" />
            </div>
            <div className="text-left">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-2">Observações</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Informações adicionais..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all resize-none" />
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
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
              {loading ? 'SALVANDO...' : 'SALVAR PREÇO'}
            </button>
          </div>
        </div>
      </div>
    </>
    , document.body);
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TarifasKwh() {
  const [prices, setPrices] = useState<KwhPrice[]>([]);
  const [history, setHistory] = useState<KwhPrice[]>([]);
  const [selectedConc, setSelectedConc] = useState('');
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToast();

  const loadPrices = async () => {
    setLoading(true);
    try {
      const data = await api.get('/kwh-prices/current');
      setPrices(Array.isArray(data) ? data : []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPrices(); }, []);

  const loadHistory = async (conc: string) => {
    setSelectedConc(conc);
    setHistoryLoading(true);
    try {
      const data = await api.get(`/kwh-prices/history/${encodeURIComponent(conc)}`);
      setHistory(Array.isArray(data) ? data : []);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este preço?')) return;
    try {
      await api.delete(`/kwh-prices/${id}`);
      toast.showSuccess('Preço excluído com sucesso!');
      loadPrices();
      if (selectedConc) loadHistory(selectedConc);
    } catch (err: any) {
      toast.showError(err.message || 'Erro ao excluir preço');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (<div key={t.id} className="pointer-events-auto"><Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} /></div>))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl"><DollarSign className="h-7 w-7 text-accent" /></div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Tarifas kWh</h1>
            <p className="text-slate-500 text-sm mt-0.5">Gestão de preços por concessionária com versionamento</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-secondary transition-colors text-sm shadow-sm shadow-accent/20">
          <Plus className="h-4 w-4" /> Novo Preço
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : (
        <>
          {/* Current Prices Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-display font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Preços Vigentes
              </h2>
            </div>
            {prices.length === 0 ? (
              <div className="p-12 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-display font-semibold text-slate-900 mb-1">Nenhum preço cadastrado</h3>
                <p className="text-slate-500 text-sm mb-4">Cadastre o primeiro preço de kWh por concessionária.</p>
                <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-secondary transition-colors">
                  <Plus className="h-4 w-4" /> Cadastrar Preço
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-5 py-3.5 text-xs font-display font-black text-slate-400 uppercase tracking-wider">Concessionária</th>
                      <th className="px-5 py-3.5 text-xs font-display font-black text-slate-400 uppercase tracking-wider text-right">Preço/kWh</th>
                      <th className="px-5 py-3.5 text-xs font-display font-black text-slate-400 uppercase tracking-wider">Vigente desde</th>
                      <th className="px-5 py-3.5 text-xs font-display font-black text-slate-400 uppercase tracking-wider">Fonte</th>
                      <th className="px-5 py-3.5 text-xs font-display font-black text-slate-400 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map(p => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-100 rounded-lg"><Building2 className="h-4 w-4 text-slate-500" /></div>
                            <span className="font-display font-bold text-slate-900">{p.concessionaire}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl font-black text-sm">
                            R$ {p.pricePerKwh.toFixed(4)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(p.effectiveFrom).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{p.source || '—'}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => loadHistory(p.concessionaire)} className={`p-2 rounded-lg transition-colors ${selectedConc === p.concessionaire ? 'text-accent bg-accent/10' : 'text-slate-400 hover:text-accent hover:bg-accent/10'}`} title="Ver histórico">
                              <History className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* History Section */}
          {selectedConc && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-display font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-accent" /> Histórico: {selectedConc}
                </h2>
                <button onClick={() => setSelectedConc('')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"><X className="h-4 w-4" /></button>
              </div>
              {historyLoading ? (
                <div className="h-32 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">Nenhum histórico encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-5 py-3 text-xs font-display font-black text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-xs font-display font-black text-slate-400 uppercase tracking-wider text-right">Preço/kWh</th>
                        <th className="px-5 py-3 text-xs font-display font-black text-slate-400 uppercase tracking-wider">De</th>
                        <th className="px-5 py-3 text-xs font-display font-black text-slate-400 uppercase tracking-wider">Até</th>
                        <th className="px-5 py-3 text-xs font-display font-black text-slate-400 uppercase tracking-wider">Fonte</th>
                        <th className="px-5 py-3 text-xs font-display font-black text-slate-400 uppercase tracking-wider">Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => {
                        const isCurrent = !h.effectiveUntil;
                        return (
                          <tr key={h.id} className={`border-b border-slate-100 transition-colors ${isCurrent ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}`}>
                            <td className="px-5 py-3.5">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" /> Vigente
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-500">Expirado</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span className={`font-black text-sm ${isCurrent ? 'text-emerald-700' : 'text-slate-600'}`}>
                                R$ {h.pricePerKwh.toFixed(4)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-slate-600">{new Date(h.effectiveFrom).toLocaleDateString('pt-BR')}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-600">{h.effectiveUntil ? new Date(h.effectiveUntil).toLocaleDateString('pt-BR') : '—'}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-500">{h.source || '—'}</td>
                            <td className="px-5 py-3.5 text-sm text-slate-500 max-w-[200px] truncate">{h.notes || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <CreatePriceModal open={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => { loadPrices(); toast.showSuccess('Preço cadastrado! O anterior foi encerrado automaticamente.'); }} />
    </div>
  );
}
